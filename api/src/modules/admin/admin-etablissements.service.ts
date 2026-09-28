import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException, ERROR_CODES } from '../../common/errors';
import { AuditService } from '../../common/audit/audit.service';
import { slugLibre, versSlug } from '../../common/texte/slug';
import { PrismaService } from '../../prisma/prisma.service';
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
