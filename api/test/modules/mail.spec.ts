import type { ConfigService } from '@nestjs/config';
import { NotificationCanal, NotificationType, RoleCode } from '@/generated/prisma';
import { ExpediteurMailService } from '@/modules/mail/expediteur.service';
import { MailService, type Courriel } from '@/modules/mail/mail.service';
import { modeleNotification, modeleReinitialisation } from '@/modules/mail/modeles-mail';

/** Un `ConfigService` qui rend ce qu'on lui donne, et rien d'autre. */
function config(valeurs: Record<string, string>): ConfigService {
  return { get: (cle: string) => valeurs[cle] } as unknown as ConfigService;
}

/**
 * Envoi de courriel — B-53.
 *
 * AUCUN SERVEUR SMTP N'EST OUVERT ICI, et c'est la propriété que ce fichier
 * éprouve en premier. La CI n'a pas de messagerie, et une suite qui tenterait
 * une connexion sortante échouerait là-bas en passant ici. Le service non
 * configuré doit donc se taire proprement — pas lever, pas bloquer.
 *
 * SUITE UNITAIRE, SANS BASE. Contrairement au reste du projet, rien ici ne
 * demande MySQL : les modèles sont des fonctions pures, et l'expéditeur est
 * éprouvé contre un faux client Prisma. C'est ce qui permet de vérifier des
 * chemins d'échec — une adresse qui refuse cinq fois — qu'on ne saurait pas
 * provoquer sur une vraie messagerie.
 */
describe('Envoi de courriel (unitaire)', () => {
  describe('MailService', () => {
    it('reste éteint quand un seul réglage manque', () => {
      // Le mot de passe manque : un transport construit malgré tout
      // échouerait au premier envoi, en production.
      const service = new MailService(
        config({
          SMTP_HOST: 'smtp.exemple.ma',
          SMTP_USER: 'contact@ecoles360.com',
          MAIL_FROM: 'contact@ecoles360.com',
        }),
      );

      expect(service.actif).toBe(false);
    });

    it('refuse l’envoi sans lever quand il est éteint', async () => {
      const service = new MailService(config({}));

      await expect(
        service.envoyer({ a: 'x@y.ma', sujet: 's', texte: 't', html: '<p>t</p>' }),
      ).resolves.toBe(false);
    });

    it('s’allume quand les quatre réglages sont là', () => {
      const service = new MailService(
        config({
          SMTP_HOST: 'smtp.exemple.ma',
          SMTP_PORT: '587',
          SMTP_USER: 'contact@ecoles360.com',
          SMTP_PASSWORD: 'secret-de-test',
          MAIL_FROM: 'contact@ecoles360.com',
        }),
      );

      // Construire le transport n'ouvre AUCUNE connexion : nodemailer se
      // connecte au premier envoi. Le test reste donc hors réseau.
      expect(service.actif).toBe(true);
      service.onModuleDestroy();
    });
  });

  describe('modèles', () => {
    const contexte = {
      type: NotificationType.moderation,
      contenu: 'Un avis attend votre modération sur Lycée Al Massira.',
      administration: true,
      appUrl: 'https://ecoles360.com',
    };

    it('mène à l’écran qui permet d’agir, selon le destinataire', () => {
      const admin = modeleNotification('direction@ecoles360.com', contexte);
      const etablissement = modeleNotification('contact@almassira.ma', {
        ...contexte,
        administration: false,
      });

      expect(admin.html).toContain('https://ecoles360.com/admin/avis');
      // Le mauvais lien ferait atterrir l'établissement sur un 403.
      expect(etablissement.html).toContain('https://ecoles360.com/espace/avis');
    });

    it('garde le sujet neutre — il voyage en clair', () => {
      const courriel = modeleNotification('direction@ecoles360.com', contexte);

      expect(courriel.sujet).toBe('écoles360 — Un avis attend votre modération');
      // Le nom de l'établissement est dans le corps, pas dans le sujet que
      // tous les serveurs relais journalisent.
      expect(courriel.sujet).not.toContain('Massira');
      expect(courriel.texte).toContain('Massira');
    });

    it('échappe le HTML venu de la base', () => {
      const courriel = modeleNotification('a@b.ma', {
        ...contexte,
        contenu: 'Avis de <script>alert(1)</script> sur une fiche',
      });

      expect(courriel.html).not.toContain('<script>');
      expect(courriel.html).toContain('&lt;script&gt;');
    });

    it('porte toujours les deux formes, texte et HTML', () => {
      for (const courriel of [
        modeleNotification('a@b.ma', contexte),
        modeleReinitialisation('a@b.ma', 'https://ecoles360.com/mot-de-passe?jeton=abc', 1),
      ] as Courriel[]) {
        // Un message en HTML seul part au courrier indésirable chez la
        // plupart des hébergeurs.
        expect(courriel.texte.length).toBeGreaterThan(20);
        expect(courriel.html).toContain('<html');
      }
    });

    it('n’écrit jamais un mot de passe dans le message de réinitialisation', () => {
      const courriel = modeleReinitialisation('a@b.ma', 'https://ecoles360.com/jeton', 1);

      // Un mot de passe envoyé par courriel reste lisible dans la boîte de
      // réception pour toujours : seul un lien part.
      expect(courriel.texte.toLowerCase()).toContain('lien');
      expect(courriel.texte).not.toMatch(/mot de passe (est|provisoire|temporaire)/i);
      expect(courriel.texte).toContain('une heure'.replace('une ', '1 '));
    });
  });

  describe('ExpediteurMailService', () => {
    /** Une ligne en attente, telle que la file la rend. */
    const enAttente = (
      id: bigint,
      role: RoleCode = RoleCode.superadmin,
      email = 'direction@ecoles360.com',
    ) => ({
      id,
      type: NotificationType.demande,
      contenu: 'Une nouvelle demande de contact est arrivée.',
      user: { email, role: { code: role } },
    });

    function fausseBase(lignes: ReturnType<typeof enAttente>[]) {
      const majs: { id: bigint; data: Record<string, unknown> }[] = [];

      return {
        majs,
        db: {
          notification: {
            findMany: jest.fn().mockResolvedValue(lignes),
            update: jest.fn((appel: { where: { id: bigint }; data: Record<string, unknown> }) => {
              majs.push({ id: appel.where.id, data: appel.data });

              return Promise.resolve({});
            }),
          },
        },
      };
    }

    function expediteur(
      lignes: ReturnType<typeof enAttente>[],
      envoi: (courriel: Courriel) => Promise<boolean>,
    ) {
      const base = fausseBase(lignes);
      const mail = { actif: true, envoyer: jest.fn(envoi) } as unknown as MailService;

      return {
        ...base,
        mail,
        service: new ExpediteurMailService(
          base.db as never,
          mail,
          config({ APP_URL: 'https://ecoles360.com/' }),
        ),
      };
    }

    it('ne touche pas la base quand aucun compte SMTP n’est configuré', async () => {
      const base = fausseBase([enAttente(1n)]);
      const service = new ExpediteurMailService(
        base.db as never,
        { actif: false } as unknown as MailService,
        config({}),
      );

      await expect(service.ecouler()).resolves.toEqual({ envoyes: 0, echecs: 0 });
      expect(base.db.notification.findMany).not.toHaveBeenCalled();
    });

    it('date l’envoi réussi, et compte l’échec à part, dans le même lot', async () => {
      // Une adresse sur deux refuse : un échec ne doit pas interrompre le lot,
      // sinon une seule boîte morte bloquerait toute la file derrière elle.
      const { service, majs } = expediteur(
        [enAttente(1n), enAttente(2n, RoleCode.etablissement, 'boite-morte@exemple.ma')],
        (courriel) => Promise.resolve(courriel.a !== 'boite-morte@exemple.ma'),
      );

      const bilan = await service.ecouler();

      expect(bilan).toEqual({ envoyes: 1, echecs: 1 });
      expect(majs).toHaveLength(2);
      expect(majs[0]!.data).toHaveProperty('envoyee_le');
      expect(majs[1]!.data).toEqual({ tentatives: { increment: 1 } });
    });

    it('compte la tentative plutôt que de dater un envoi qui n’a pas eu lieu', async () => {
      const { service, majs } = expediteur([enAttente(7n)], () => Promise.resolve(false));

      const bilan = await service.ecouler();

      expect(bilan).toEqual({ envoyes: 0, echecs: 1 });
      // SANS `envoyee_le` : la ligne reste dans la file. La dater
      // signifierait « parti » et le courriel serait perdu en silence.
      expect(majs[0]!.data).toEqual({ tentatives: { increment: 1 } });
    });

    it('ne reprend que les courriels en attente sous le plafond de tentatives', async () => {
      const { service, db } = expediteur([], () => Promise.resolve(true));

      await service.ecouler();

      const filtre = db.notification.findMany.mock.calls[0]![0].where;

      expect(filtre).toEqual({
        canal: NotificationCanal.email,
        envoyee_le: null,
        tentatives: { lt: 5 },
      });
    });

    it('envoie l’administration sur ses écrans, l’établissement sur les siens', async () => {
      const { service, mail } = expediteur(
        [enAttente(1n, RoleCode.superadmin), enAttente(2n, RoleCode.etablissement)],
        () => Promise.resolve(true),
      );

      await service.ecouler();

      const envois = (mail.envoyer as jest.Mock).mock.calls.map(([c]: [Courriel]) => c.html);

      expect(envois[0]).toContain('/admin/etablissements');
      expect(envois[1]).toContain('/espace/demandes');
      // La barre oblique finale d'`APP_URL` ne doit pas se dédoubler.
      expect(envois[0]).not.toContain('//admin');
    });
  });
});
