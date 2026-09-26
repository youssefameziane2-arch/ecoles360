import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { AppException, ERROR_CODES } from '../../common/errors';
import { StockageService, type FichierTeleverse } from '../../common/stockage/stockage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleCode } from '../../generated/prisma';

/**
 * Galerie d'un établissement — téléversement, remplacement, ordre.
 *
 * PARTAGÉ ENTRE L'ADMIN ET L'ESPACE ÉTABLISSEMENT. Les deux font exactement le
 * même geste sur les mêmes lignes ; seul le rôle inscrit au journal diffère.
 * Écrire deux fois la logique, ce serait garantir qu'elles divergent — et que
 * la seconde oublie un jour de supprimer le fichier du volume.
 *
 * LE FICHIER ET SA LIGNE VONT ENSEMBLE, mais pas dans le même ordre selon le
 * sens : à l'ajout on écrit le fichier AVANT la ligne (un fichier orphelin ne
 * se voit nulle part) ; à la suppression on efface la ligne AVANT le fichier
 * (une ligne qui pointe vers un fichier disparu afficherait une image cassée
 * sur la fiche publique). Dans les deux cas, l'incident penche du côté
 * invisible.
 */

/**
 * Plafond par fiche — 60 photos.
 *
 * Ce n'est PAS une limite d'affichage : la galerie publique les montre toutes,
 * sans troncature. C'est une garde de volume, et une contrainte du modèle —
 * `ordre` est un `TINYINT UNSIGNED`, il ne compte pas au-delà de 255.
 */
export const PHOTOS_MAX_PAR_FICHE = 60;

const SELECTION = {
  id: true,
  chemin: true,
  alt: true,
  ordre: true,
  poids: true,
} as const;

@Injectable()
export class PhotosService {
  constructor(
    private readonly db: PrismaService,
    private readonly stockage: StockageService,
    private readonly audit: AuditService,
  ) {}

  /** Galerie d'une fiche, dans l'ordre d'affichage. */
  async lister(etablissementId: bigint) {
    await this.fiche(etablissementId);

    return this.db.photo.findMany({
      where: { etablissement_id: etablissementId },
      orderBy: { ordre: 'asc' },
      select: SELECTION,
    });
  }

  /** Ajoute des photos à la suite de la galerie. */
  async ajouter(
    etablissementId: bigint,
    fichiers: FichierTeleverse[],
    acteur: { userId: bigint; role: RoleCode },
  ) {
    const fiche = await this.fiche(etablissementId);

    if (fichiers.length === 0) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        'Aucun fichier reçu.',
      );
    }

    const existantes = await this.db.photo.count({ where: { etablissement_id: etablissementId } });

    if (existantes + fichiers.length > PHOTOS_MAX_PAR_FICHE) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLIT_METIER,
        `Cette fiche porte déjà ${existantes} photos — le maximum est de ${PHOTOS_MAX_PAR_FICHE}. Supprimez-en avant d'en ajouter.`,
      );
    }

    const dernier = await this.db.photo.aggregate({
      where: { etablissement_id: etablissementId },
      _max: { ordre: true },
    });

    let rang = existantes === 0 ? -1 : (dernier._max.ordre ?? -1);
    const creees: { id: bigint; chemin: string }[] = [];

    for (const fichier of fichiers) {
      // Le fichier d'abord : si l'écriture échoue, rien n'est référencé.
      const { chemin, poids } = await this.stockage.enregistrer(
        `etablissements/${etablissementId}`,
        fichier,
      );

      rang += 1;

      const photo = await this.db.photo.create({
        data: {
          etablissement_id: etablissementId,
          chemin,
          poids,
          ordre: rang,
          alt: this.legendeDepuisLeNom(fichier.originalname),
        },
        select: { id: true, chemin: true },
      });

      creees.push(photo);
    }

    await this.audit.journaliser(this.db, {
      userId: acteur.userId,
      roleActeur: acteur.role,
      action: 'etablissement.photos.ajout',
      cibleType: 'etablissement',
      cibleId: etablissementId,
      details: { fiche: fiche.nom, nombre: creees.length, chemins: creees.map((p) => p.chemin) },
    });

    return this.lister(etablissementId);
  }

  /**
   * Remplace le fichier d'une photo en conservant sa place et sa légende.
   *
   * C'est la demande telle qu'elle se formule sur le terrain : « la photo de
   * la façade est floue, en voici une meilleure ». Supprimer puis ré-ajouter
   * la renverrait en fin de galerie et perdrait sa légende.
   */
  async remplacer(
    etablissementId: bigint,
    photoId: bigint,
    fichier: FichierTeleverse,
    acteur: { userId: bigint; role: RoleCode },
  ) {
    const photo = await this.photo(etablissementId, photoId);

    const { chemin, poids } = await this.stockage.enregistrer(
      `etablissements/${etablissementId}`,
      fichier,
    );

    await this.db.photo.update({
      where: { id: photoId },
      data: { chemin, poids },
    });

    // L'ancien fichier ne part qu'une fois le nouveau référencé.
    await this.stockage.effacer(photo.chemin);

    await this.audit.journaliser(this.db, {
      userId: acteur.userId,
      roleActeur: acteur.role,
      action: 'etablissement.photos.remplacement',
      cibleType: 'etablissement',
      cibleId: etablissementId,
      details: { photo_id: photoId.toString(), avant: photo.chemin, apres: chemin },
    });

    return this.lister(etablissementId);
  }

  /** Change la légende — le texte alternatif sert aussi l'accessibilité. */
  async legender(
    etablissementId: bigint,
    photoId: bigint,
    alt: string,
    acteur: { userId: bigint; role: RoleCode },
  ) {
    const photo = await this.photo(etablissementId, photoId);

    await this.db.photo.update({ where: { id: photoId }, data: { alt } });

    await this.audit.journaliser(this.db, {
      userId: acteur.userId,
      roleActeur: acteur.role,
      action: 'etablissement.photos.legende',
      cibleType: 'etablissement',
      cibleId: etablissementId,
      details: { photo_id: photoId.toString(), avant: photo.alt, apres: alt },
    });

    return this.lister(etablissementId);
  }

  /** Retire une photo de la galerie, puis referme les trous d'`ordre`. */
  async supprimer(
    etablissementId: bigint,
    photoId: bigint,
    acteur: { userId: bigint; role: RoleCode },
  ) {
    const photo = await this.photo(etablissementId, photoId);

    await this.db.$transaction(async (tx) => {
      await tx.photo.delete({ where: { id: photoId } });

      // Compacter tout de suite : un trou dans `ordre` se propagerait au
      // prochain ajout, qui reprendrait le max + 1 et laisserait le rang vide.
      await tx.photo.updateMany({
        where: { etablissement_id: etablissementId, ordre: { gt: photo.ordre } },
        data: { ordre: { decrement: 1 } },
      });

      await this.audit.journaliser(tx, {
        userId: acteur.userId,
        roleActeur: acteur.role,
        action: 'etablissement.photos.suppression',
        cibleType: 'etablissement',
        cibleId: etablissementId,
        details: { photo_id: photoId.toString(), chemin: photo.chemin, alt: photo.alt },
      });
    });

    // Hors transaction : le disque ne sait pas revenir en arrière, et une
    // ligne supprimée avec un fichier resté là ne casse aucun affichage.
    await this.stockage.effacer(photo.chemin);

    return this.lister(etablissementId);
  }

  /**
   * Réordonne la galerie. La liste envoyée doit être COMPLÈTE.
   *
   * Accepter une liste partielle obligerait à deviner où ranger les absentes,
   * et deux onglets ouverts sur la même fiche se marcheraient dessus en
   * silence. Mieux vaut un 409 explicite qui invite à recharger.
   */
  async reordonner(
    etablissementId: bigint,
    ids: string[],
    acteur: { userId: bigint; role: RoleCode },
  ) {
    await this.fiche(etablissementId);

    const existantes = await this.db.photo.findMany({
      where: { etablissement_id: etablissementId },
      select: { id: true },
    });

    const attendus = new Set(existantes.map((p) => p.id.toString()));
    const recus = new Set(ids);

    if (attendus.size !== recus.size || [...attendus].some((id) => !recus.has(id))) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLIT_METIER,
        'La galerie a changé depuis le chargement de la page. Rechargez avant de réordonner.',
      );
    }

    await this.db.$transaction(
      ids.map((id, rang) =>
        this.db.photo.update({ where: { id: BigInt(id) }, data: { ordre: rang } }),
      ),
    );

    await this.audit.journaliser(this.db, {
      userId: acteur.userId,
      roleActeur: acteur.role,
      action: 'etablissement.photos.ordre',
      cibleType: 'etablissement',
      cibleId: etablissementId,
      details: { ordre: ids },
    });

    return this.lister(etablissementId);
  }

  private async fiche(etablissementId: bigint) {
    const fiche = await this.db.etablissement.findUnique({
      where: { id: etablissementId },
      select: { id: true, nom: true },
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
   * Retrouve une photo EN EXIGEANT sa fiche.
   *
   * Sans le `etablissement_id` dans le `where`, un identifiant de photo pris
   * au hasard permettrait d'agir sur la galerie d'une autre école — la portée
   * de l'espace établissement (RG05) ne tient que si la ressource est bornée
   * ici aussi, pas seulement dans la garde.
   */
  private async photo(etablissementId: bigint, photoId: bigint) {
    const photo = await this.db.photo.findFirst({
      where: { id: photoId, etablissement_id: etablissementId },
      select: SELECTION,
    });

    if (!photo) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cette photo n'existe pas dans la galerie de cet établissement.",
      );
    }

    return photo;
  }

  /**
   * Légende de départ, tirée du nom du fichier : `cour-de-recreation.jpg` →
   * « Cour de recreation ». Approximative, mais un champ pré-rempli se corrige,
   * là où un champ vide reste vide — et la galerie publique affiche ce texte.
   */
  private legendeDepuisLeNom(nom: string): string | null {
    const sansExtension = nom
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    if (
      sansExtension.length === 0 ||
      /^(img|image|photo|dsc|screenshot)[\s\d]*$/i.test(sansExtension)
    ) {
      return null; // « IMG_2043 » n'apprend rien à personne
    }

    return (sansExtension.charAt(0).toUpperCase() + sansExtension.slice(1)).slice(0, 160);
  }
}
