import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException, ERROR_CODES } from '../../common/errors';
import { AuditService } from '../../common/audit/audit.service';
import { slugLibre, versSlug } from '../../common/texte/slug';
import { PrismaService } from '../../prisma/prisma.service';
import { StockageService } from '../../common/stockage/stockage.service';
import { CHAMPS_PROPOSABLES as CHAMPS_PROFIL } from '../espace/fiche-proposal.service';
import type { ProposerFicheDto } from '../espace/dto/proposer-fiche.dto';
import {
  AbonnementFormule,
  AbonnementStatut,
  EtablissementSource,
  EtablissementStatut,
  FactureStatut,
  RoleCode,
  type EtablissementType,
} from '../../generated/prisma';
import type { BadgesEtablissementDto } from './dto/badges-etablissement.dto';
import type { CreerEtablissementDto } from './dto/creer-etablissement.dto';
import {
  DUREE_ESSAI_DEFAUT_JOURS,
  ParametresFacturationService,
} from './parametres-facturation.service';

/**
 * Établissements — back-office admin (livrable 11 §3.4).
 *
 * LA VALIDATION EST SUBORDONNÉE À L'ABONNEMENT (RG14). Le contrat documenté
 * répond 409 « tant que l'abonnement n'est pas encaissé ». Le module de
 * facturation complet (génération de facture, marquage payé) reste hors de
 * cette passe — `activerEssaiGratuit()` est le seul levier construit ici pour
 * satisfaire la condition sans façade : c'est un vrai `Abonnement`
 * (`formule: essai_gratuit`, sans tarif — RG13), pas un contournement de la
 * règle.
 */
@Injectable()
export class AdminEtablissementsService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
    private readonly parametres: ParametresFacturationService,
    private readonly stockage: StockageService,
  ) {}

  async lister(filtres: { statut?: EtablissementStatut; type?: EtablissementType }) {
    return this.db.etablissement.findMany({
      where: { statut: filtres.statut, type: filtres.type },
      orderBy: { cree_le: 'desc' },
      select: {
        id: true,
        nom: true,
        slug: true,
        type: true,
        statut: true,
        sponsorise: true,
        verifie: true,
        premium: true,
        cree_le: true,
        ville: { select: { nom: true } },
        proprietaire: { select: { name: true, email: true } },
        abonnements: {
          where: { statut: { in: [AbonnementStatut.actif, AbonnementStatut.essai] } },
          orderBy: { debut: 'desc' },
          take: 1,
          select: { formule: true, statut: true, echeance: true },
        },
      },
    });
  }

  /**
   * Tout ce dont le formulaire de création a besoin, en une requête.
   *
   * Les villes et les caractéristiques sont des référentiels : quelques
   * dizaines de lignes qui ne bougent qu'à la migration. Les charger en trois
   * appels ferait clignoter le formulaire pendant que les listes se
   * remplissent une à une.
   */
  async referentiel() {
    const [villes, caracteristiques] = await Promise.all([
      this.db.ville.findMany({
        orderBy: { nom: 'asc' },
        select: { id: true, nom: true, region: true },
      }),
      this.db.niveauFiliere.findMany({
        orderBy: [{ categorie: 'asc' }, { libelle: 'asc' }],
        select: { id: true, libelle: true, categorie: true },
      }),
    ]);

    return { villes, caracteristiques };
  }

  /**
   * Crée une fiche depuis le back-office.
   *
   * ELLE NAÎT `en_attente`, PAS `validee` (RG03). L'administrateur a beau
   * être l'autorité de validation, publier d'un même geste court-circuiterait
   * la RG14 : une fiche visible sans abonnement encaissé. La valider reste
   * donc une seconde action, celle qui vérifie que la vente est faite.
   *
   * SANS PROPRIÉTAIRE (RG04). La fiche saisie d'après un rendez-vous
   * commercial n'a pas encore de compte en face ; `proprietaire_user_id` reste
   * NULL jusqu'à la revendication.
   */
  async creer(dto: CreerEtablissementDto, adminId: bigint) {
    const ville = await this.db.ville.findUnique({
      where: { id: BigInt(dto.ville_id) },
      select: { id: true, nom: true },
    });

    if (!ville) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        "Cette ville n'existe pas.",
      );
    }

    if (dto.budget_min != null && dto.budget_max != null && dto.budget_min > dto.budget_max) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        'Le budget minimum dépasse le budget maximum.',
      );
    }

    const caracteristiques = await this.caracteristiquesExistantes(dto.caracteristiques ?? []);

    // Le slug porte la ville : deux « École Al Amal » dans deux villes
    // différentes sont deux écoles différentes, et leurs adresses publiques
    // doivent se distinguer sans suffixe numérique.
    const slug = await slugLibre(
      `${dto.nom} ${ville.nom}`,
      async (candidat) =>
        Boolean(
          await this.db.etablissement.findUnique({
            where: { slug: candidat },
            select: { id: true },
          }),
        ),
      { repli: 'etablissement', longueurMax: 160 },
    );

    return this.db.$transaction(async (tx) => {
      const groupeId = dto.groupe ? await this.groupe(tx, dto.groupe) : null;

      const etablissement = await tx.etablissement.create({
        data: {
          nom: dto.nom.trim(),
          slug,
          ville_id: ville.id,
          type: dto.type,
          statut: EtablissementStatut.en_attente,
          source: EtablissementSource.direct,
          groupe_id: groupeId,
          adresse: vide(dto.adresse),
          quartier: vide(dto.quartier),
          lat: dto.lat ?? null,
          lng: dto.lng ?? null,
          tel: vide(dto.tel),
          whatsapp: vide(dto.whatsapp),
          email: vide(dto.email),
          site_web: vide(dto.site_web),
          description: vide(dto.description),
          langues: vide(dto.langues),
          budget_min: dto.budget_min ?? null,
          budget_max: dto.budget_max ?? null,
          niveaux: { create: caracteristiques.map((niveau_id) => ({ niveau_id })) },
        },
        select: { id: true, nom: true, slug: true },
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'etablissement.creation',
        cibleType: 'etablissement',
        cibleId: etablissement.id,
        details: {
          nom: etablissement.nom,
          slug: etablissement.slug,
          ville: ville.nom,
          type: dto.type,
        },
      });

      return etablissement;
    });
  }

  /**
   * Retient les seules caractéristiques qui existent, en les dédoublonnant.
   *
   * Un identifiant périmé — référentiel rechargé pendant que le formulaire
   * était ouvert — ferait échouer l'insertion par violation de clé étrangère,
   * et la saisie entière serait perdue pour une case à cocher. On l'ignore.
   */
  private async caracteristiquesExistantes(ids: number[]): Promise<bigint[]> {
    if (ids.length === 0) {
      return [];
    }

    const trouvees = await this.db.niveauFiliere.findMany({
      where: { id: { in: [...new Set(ids)].map((id) => BigInt(id)) } },
      select: { id: true },
    });

    return trouvees.map((n) => n.id);
  }

  /** Rattache au groupe portant ce nom, en le créant s'il est inconnu. */
  private async groupe(tx: Pick<PrismaService, 'groupeScolaire'>, nom: string): Promise<bigint> {
    const slug = versSlug(nom, 200) || 'groupe';

    const groupe = await tx.groupeScolaire.upsert({
      where: { slug },
      create: { nom: nom.trim(), slug },
      update: {},
      select: { id: true },
    });

    return groupe.id;
  }

  /**
   * Transition de statut — RG03. Le passage à `validee` exige un abonnement
   * encaissé : essai gratuit actif, ou une facture payée adossée à un
   * abonnement (RG14).
   */
  async changerStatut(
    etablissementId: bigint,
    cible: EtablissementStatut,
    adminId: bigint,
  ): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const etablissement = await tx.etablissement.findUnique({
        where: { id: etablissementId },
        select: { id: true, statut: true },
      });

      if (!etablissement) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          ERROR_CODES.RESSOURCE_INTROUVABLE,
          "Cet établissement n'existe pas.",
        );
      }

      if (cible === EtablissementStatut.validee) {
        const encaisse = await this.abonnementEncaisse(tx, etablissementId);

        if (!encaisse) {
          throw new AppException(
            HttpStatus.CONFLICT,
            ERROR_CODES.CONFLIT_METIER,
            "L'abonnement de cet établissement n'est pas encaissé — activez un essai gratuit ou marquez sa facture payée avant de valider.",
          );
        }
      }

      await tx.etablissement.update({ where: { id: etablissementId }, data: { statut: cible } });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: `etablissement.statut.${cible}`,
        cibleType: 'etablissement',
        cibleId: etablissementId,
        details: { depuis: etablissement.statut, vers: cible },
      });
    });
  }

  /** Un abonnement actif/essai suffit, ou une facture payée adossée à un abonnement échu. */
  private async abonnementEncaisse(
    tx: Pick<PrismaService, 'abonnement' | 'facture'>,
    etablissementId: bigint,
  ): Promise<boolean> {
    const abonnementActif = await tx.abonnement.findFirst({
      where: {
        etablissement_id: etablissementId,
        statut: { in: [AbonnementStatut.essai, AbonnementStatut.actif] },
      },
      select: { id: true, formule: true },
    });

    if (!abonnementActif) {
      return false;
    }

    if (abonnementActif.formule === AbonnementFormule.essai_gratuit) {
      return true;
    }

    const facturePayee = await tx.facture.findFirst({
      where: { abonnement_id: abonnementActif.id, statut_paiement: FactureStatut.payee },
      select: { id: true },
    });

    return Boolean(facturePayee);
  }

  /** Le profil complet d'une fiche, tel que l'écran d'édition en a besoin. */
  async profil(etablissementId: bigint) {
    const fiche = await this.db.etablissement.findUnique({
      where: { id: etablissementId },
      include: {
        ville: { select: { id: true, nom: true, slug: true } },
        photos: {
          select: { id: true, chemin: true, alt: true, ordre: true },
          orderBy: { ordre: 'asc' },
        },
        niveaux: { select: { niveau: { select: { id: true, libelle: true, categorie: true } } } },
      },
    });

    if (!fiche) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cet établissement n'existe pas.",
      );
    }

    return fiche;
  }

  /**
   * Écrit le profil complet d'une fiche — blocs de l'avenant 3 compris.
   *
   * POURQUOI L'ADMINISTRATEUR ÉCRIT DIRECTEMENT, LÀ OÙ L'ÉTABLISSEMENT
   * PROPOSE. La RG20 borne l'ÉTABLISSEMENT : il propose, l'administration
   * publie. Elle ne dit pas que l'administration doive se proposer des
   * modifications à elle-même puis les approuver — elle EST l'autorité de
   * validation, et c'est déjà ainsi qu'elle crée une fiche.
   *
   * CE QUI REND CETTE ROUTE NÉCESSAIRE : le formulaire de création ne couvre
   * que l'état civil de l'école. Équipements, équipe, horaires, chiffres,
   * FAQ, projet pédagogique, autres projets, réseaux sociaux et vidéo
   * n'étaient renseignables que depuis l'espace de l'établissement — donc
   * jamais, tant qu'une école n'a pas de compte. Les onglets correspondants
   * de la fiche publique ne s'affichent que si leur donnée existe : ils
   * restaient invisibles, et rien ne disait pourquoi.
   *
   * LA MÊME LISTE DE CHAMPS QUE LA PROPOSITION, et le même DTO : deux
   * whitelists finiraient par diverger, et c'est celle qu'on oublierait de
   * mettre à jour qui laisserait passer un attribut de plateforme (RG27).
   */
  async ecrireProfil(
    etablissementId: bigint,
    dto: ProposerFicheDto,
    adminId: bigint,
  ): Promise<void> {
    const avant = await this.db.etablissement.findUnique({
      where: { id: etablissementId },
      select: { id: true, nom: true, slug: true },
    });

    if (!avant) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cet établissement n'existe pas.",
      );
    }

    // Recopie champ à champ depuis la whitelist, plutôt que d'appliquer le
    // DTO tel quel : `forbidNonWhitelisted` refuse déjà l'inconnu, mais cette
    // liste est ce qui garantit qu'aucun attribut de plateforme — `verifie`,
    // `premium`, `sponsorise`, `note_moy` — ne puisse jamais passer par ici.
    const donnees: Record<string, unknown> = {};
    for (const champ of CHAMPS_PROFIL) {
      if (champ in dto) {
        donnees[champ] = (dto as unknown as Record<string, unknown>)[champ] ?? null;
      }
    }

    await this.db.$transaction(async (tx) => {
      await tx.etablissement.update({ where: { id: etablissementId }, data: donnees });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'etablissement.profil.modifie',
        cibleType: 'etablissement',
        cibleId: etablissementId,
        details: { nom: avant.nom, champs: Object.keys(donnees) },
      });
    });
  }

  /**
   * Supprime une fiche CRÉÉE PAR ERREUR — et elle seule.
   *
   * POURQUOI CE N'EST PAS UNE SUPPRESSION GÉNÉRALE. Toutes les relations de
   * `Etablissement` sont en `onDelete: Cascade` : effacer la fiche effacerait
   * ses avis, ses demandes de contact, ses abonnements et SES FACTURES — que
   * la loi impose de conserver dix ans (RG14). Un bouton « Supprimer » sans
   * garde détruirait donc des pièces comptables, sans rien pour le signaler.
   *
   * La garde délimite le seul cas sans perte : une fiche JAMAIS VALIDÉE, sans
   * avis, sans demande et sans abonnement. C'est la faute de frappe du jour
   * même, pas l'école qui s'en va.
   *
   * CE QU'IL FAUT FAIRE D'UNE ÉCOLE QUI SE RETIRE N'EST PAS TRANCHÉ. En
   * attendant, « Suspendre » la sort du site public (RG03) en gardant tout son
   * historique — ce qui est de toute façon le comportement souhaitable.
   */
  async supprimer(etablissementId: bigint, adminId: bigint): Promise<void> {
    const fiche = await this.db.etablissement.findUnique({
      where: { id: etablissementId },
      select: {
        id: true,
        nom: true,
        slug: true,
        statut: true,
        valide_le: true,
        photos: { select: { chemin: true } },
        _count: { select: { avis: true, demandes: true, abonnements: true } },
      },
    });

    if (!fiche) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cet établissement n'existe pas.",
      );
    }

    // `valide_le` plutôt que le seul statut : une fiche validée puis suspendue
    // a été publique, et a pu recevoir des avis depuis effacés. Le statut
    // courant ne dit rien de son passé.
    const dejaPubliee = fiche.valide_le !== null || fiche.statut === EtablissementStatut.validee;
    const { avis, demandes, abonnements } = fiche._count;

    if (dejaPubliee || avis > 0 || demandes > 0 || abonnements > 0) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLIT_METIER,
        'Cette fiche ne peut plus être supprimée : elle a été publiée, ou porte des avis, ' +
          'des demandes ou un abonnement. Utilisez « Suspendre » pour la retirer du site ' +
          'tout en conservant son historique.',
      );
    }

    await this.db.$transaction(async (tx) => {
      // JOURNALISÉ AVANT L'EFFACEMENT (RG15) : après, il ne resterait plus
      // rien à nommer. Le nom et le slug survivent donc à la fiche.
      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'etablissement.supprime',
        cibleType: 'etablissement',
        cibleId: etablissementId,
        details: { nom: fiche.nom, slug: fiche.slug, photos: fiche.photos.length },
      });

      await tx.etablissement.delete({ where: { id: etablissementId } });
    });

    // Hors transaction : le disque ne sait pas revenir en arrière. Les lignes
    // `photo` sont parties en cascade ; sans ceci leurs fichiers resteraient
    // sur le volume sans que rien ne les référence plus.
    for (const photo of fiche.photos) {
      await this.stockage.effacer(photo.chemin);
    }
  }

  /** Active un essai gratuit — RG13 : sans tarif, débloque la validation sans facture. */
  async activerEssaiGratuit(etablissementId: bigint, adminId: bigint): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const enCours = await tx.abonnement.findFirst({
        where: {
          etablissement_id: etablissementId,
          statut: { in: [AbonnementStatut.essai, AbonnementStatut.actif] },
        },
        select: { id: true },
      });

      if (enCours) {
        throw new AppException(
          HttpStatus.CONFLICT,
          ERROR_CODES.CONFLIT_METIER,
          'Un abonnement est déjà actif pour cet établissement.',
        );
      }

      // La durée vient des paramètres de facturation (RG13), plus d'une
      // constante du code : la direction la change depuis son écran.
      const duree = await this.parametres.entier(
        'duree_essai_gratuit_jours',
        DUREE_ESSAI_DEFAUT_JOURS,
      );

      const debut = new Date();
      const echeance = new Date(debut);
      echeance.setDate(echeance.getDate() + duree);

      await tx.abonnement.create({
        data: {
          etablissement_id: etablissementId,
          formule: AbonnementFormule.essai_gratuit,
          debut,
          echeance,
          statut: AbonnementStatut.essai,
        },
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'etablissement.essai_gratuit.active',
        cibleType: 'etablissement',
        cibleId: etablissementId,
        details: { echeance: echeance.toISOString() },
      });
    });
  }

  /** Bascule des attributs de plateforme — RG19, RG27. */
  async basculerBadges(
    etablissementId: bigint,
    dto: BadgesEtablissementDto,
    adminId: bigint,
  ): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const etablissement = await tx.etablissement.findUnique({
        where: { id: etablissementId },
        select: { id: true },
      });

      if (!etablissement) {
        throw new AppException(
          HttpStatus.NOT_FOUND,
          ERROR_CODES.RESSOURCE_INTROUVABLE,
          "Cet établissement n'existe pas.",
        );
      }

      await tx.etablissement.update({
        where: { id: etablissementId },
        data: {
          sponsorise: dto.sponsorise,
          verifie: dto.verifie,
          premium: dto.premium,
        },
      });

      await this.audit.journaliser(tx, {
        userId: adminId,
        roleActeur: RoleCode.superadmin,
        action: 'etablissement.badges.bascule',
        cibleType: 'etablissement',
        cibleId: etablissementId,
        details: { ...dto },
      });
    });
  }
}

/**
 * Normalise un champ facultatif : `''` et `'   '` deviennent NULL.
 *
 * Un opérateur qui efface un champ envoie une chaîne vide, pas `undefined`.
 * La persister ferait afficher « Téléphone : » suivi de rien sur la fiche
 * publique, et surtout `e.tel && …` la tiendrait pour renseignée — le bouton
 * « Appeler » s'afficherait sur un numéro inexistant.
 */
function vide(valeur: string | undefined): string | null {
  const nettoye = valeur?.trim();

  return nettoye ? nettoye : null;
}
