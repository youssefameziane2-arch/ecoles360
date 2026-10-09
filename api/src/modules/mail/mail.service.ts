import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

/** Un message prêt à partir. */
export interface Courriel {
  a: string;
  sujet: string;
  texte: string;
  html: string;
}

/**
 * Envoi de courriel — B-53, livrable 11 §6.
 *
 * LE SERVICE EXISTE MÊME SANS COMPTE SMTP, et c'est la décision qui gouverne
 * tout le reste. Le projet n'a pas encore d'adresse expéditrice : si l'absence
 * de réglages empêchait l'API de démarrer, ou faisait échouer la validation
 * d'une fiche, il aurait fallu attendre le client pour écrire une seule ligne.
 * Non configuré, le service se déclare éteint, le dit UNE fois au démarrage,
 * et refuse poliment chaque envoi. Le jour où les cinq variables sont posées
 * dans `.env`, il s'allume — sans qu'aucun appelant ne change.
 *
 * C'EST AUSSI CE QUI REND LES TESTS POSSIBLES. Les 397 tests tournent sans
 * serveur de messagerie : le service est éteint, les envois sont comptés comme
 * refusés, et rien n'essaie d'ouvrir une connexion vers l'extérieur depuis une
 * machine d'intégration continue.
 *
 * UN ENVOI NE LÈVE JAMAIS. Il rend `true` ou `false`. L'appelant est toujours
 * une action métier déjà accomplie — une fiche validée, un avis modéré — et
 * perdre cette action parce que le serveur SMTP tousse serait absurde. C'est
 * la même règle que les notifications en base, pour la même raison.
 */
@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly logger = new Logger('Mail');
  private transport: Transporter | null = null;

  /** L'adresse affichée en expéditeur — nulle quand le service est éteint. */
  private readonly expediteur: string | null;

  constructor(private readonly config: ConfigService) {
    const hote = this.config.get<string>('SMTP_HOST')?.trim();
    const utilisateur = this.config.get<string>('SMTP_USER')?.trim();
    const motDePasse = this.config.get<string>('SMTP_PASSWORD');
    const de = this.config.get<string>('MAIL_FROM')?.trim();

    // LES QUATRE SONT EXIGÉS ENSEMBLE. Un hôte sans identifiants, ou des
    // identifiants sans adresse d'expédition, produiraient un transport qui se
    // construit puis échoue au premier envoi — une panne découverte en
    // production plutôt qu'au démarrage.
    if (!hote || !utilisateur || !motDePasse || !de) {
      this.expediteur = null;
      this.logger.warn(
        'Envoi de courriel ÉTEINT : SMTP_HOST, SMTP_USER, SMTP_PASSWORD et MAIL_FROM ne sont pas tous renseignés. Les notifications restent visibles dans le centre.',
      );

      return;
    }

    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);

    this.expediteur = de;
    this.transport = createTransport({
      host: hote,
      port,
      // 465 EST LE SEUL PORT EN TLS IMPLICITE. Sur 587 la connexion s'ouvre en
      // clair puis passe en TLS par STARTTLS ; forcer `secure` y ferait échouer
      // la poignée de main, et c'est l'erreur la plus courante en configurant
      // un SMTP.
      secure: port === 465,
      auth: { user: utilisateur, pass: motDePasse },
      // Une connexion réutilisée plutôt qu'une par message : l'expéditeur
      // traite les courriels par lots, et rouvrir une session TLS à chaque
      // ligne coûte plus que l'envoi lui-même.
      pool: true,
      maxConnections: 2,
    });

    this.logger.log(`Envoi de courriel actif — ${utilisateur}@${hote}:${port}, de « ${de} »`);
  }

  /** Vrai si les réglages permettent d'envoyer. */
  get actif(): boolean {
    return this.transport !== null;
  }

  /**
   * Envoie un message. Rend `false` plutôt que de lever — voir l'en-tête.
   */
  async envoyer(courriel: Courriel): Promise<boolean> {
    if (!this.transport || !this.expediteur) {
      return false;
    }

    try {
      await this.transport.sendMail({
        from: this.expediteur,
        to: courriel.a,
        subject: courriel.sujet,
        // LES DEUX FORMES, TOUJOURS. Un message en HTML seul part au courrier
        // indésirable chez la plupart des hébergeurs, et reste illisible pour
        // qui lit ses messages en texte brut.
        text: courriel.texte,
        html: courriel.html,
      });

      return true;
    } catch (erreur) {
      this.logger.warn(
        `Courriel non parti vers ${courriel.a} : ${erreur instanceof Error ? erreur.message : String(erreur)}`,
      );

      return false;
    }
  }

  /**
   * Ferme le groupe de connexions.
   *
   * SANS CELA, JEST NE REND PAS LA MAIN. Un transport en `pool` garde des
   * sockets ouvertes ; la suite paraît bloquée alors qu'elle a fini, et l'on
   * cherche la panne ailleurs — c'est exactement ce qui est arrivé avec Redis,
   * et la leçon est consignée dans `purges.spec.ts`.
   */
  onModuleDestroy(): void {
    this.transport?.close();
  }
}
