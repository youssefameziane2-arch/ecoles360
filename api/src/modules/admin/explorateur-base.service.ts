import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException, ERROR_CODES } from '../../common/errors';
import { PrismaService } from '../../prisma/prisma.service';
import { Page } from '../../common/interceptors';

/** Lignes par page — la maquette en montre une dizaine. */
const PAR_PAGE = 25;

/**
 * Explorateur de base — écran `isAdminDb` de la maquette.
 *
 * LECTURE SEULE, ET AUCUNE REQUÊTE LIBRE. L'écran montre six tables choisies,
 * colonne par colonne. Il n'accepte ni SQL, ni nom de table arbitraire, ni
 * sélection de champs : tout vient des listes ci-dessous. Un explorateur qui
 * prendrait un nom de table en paramètre serait une injection SQL avec une
 * interface.
 *
 * CHAQUE COLONNE EST ÉNUMÉRÉE, JAMAIS `SELECT *`. C'est la seule protection
 * qui tienne dans le temps : une colonne ajoutée au schéma demain
 * n'apparaîtra pas ici sans qu'on l'ait voulu. Avec `SELECT *`, le jour où
 * quelqu'un ajoute un jeton ou un secret à `users`, il s'affiche sur cet
 * écran — et personne ne s'en aperçoit.
 *
 * CE QUI EST VOLONTAIREMENT ABSENT :
 *
 * - `users.passwordHash` — un hachage Argon2id n'a rien à faire sur un écran,
 *   même pour un administrateur. Le voir ne sert à rien ; le copier sert à
 *   quelqu'un ;
 * - `avis.auteur_contact` — l'adresse ou le téléphone d'un parent qui a
 *   déposé un avis. Le site public ne le rend jamais (loi 09-08), et un
 *   explorateur n'est pas une raison de le rendre ;
 * - les jetons de réinitialisation, les sessions, le journal d'audit — le
 *   journal a son propre écran, qui le présente avec son contexte.
 */
@Injectable()
export class ExplorateurBaseService {
  constructor(private readonly db: PrismaService) {}

  /**
   * Les six tables de la maquette, et rien d'autre.
   *
   * La clé est publique — elle voyage dans l'URL —, le `lire` ne l'est pas :
   * c'est une fonction du service, pas un nom de table interpolé.
   */
  private readonly tables = {
    etablissements: {
      libelle: 'Établissements',
      colonnes: ['id', 'nom', 'slug', 'type', 'statut', 'ville', 'cree_le'],
      lire: (page: number) =>
        this.db.etablissement.findMany({
          orderBy: { id: 'desc' },
          skip: (page - 1) * PAR_PAGE,
          take: PAR_PAGE,
          select: {
            id: true,
            nom: true,
            slug: true,
            type: true,
            statut: true,
            cree_le: true,
            ville: { select: { nom: true } },
          },
        }),
      compter: () => this.db.etablissement.count(),
      aplatir: (ligne: Record<string, unknown>) => ({
        ...ligne,
        ville: (ligne.ville as { nom: string } | null)?.nom ?? null,
      }),
    },

    utilisateurs: {
      libelle: 'Utilisateurs',
      // NI `passwordHash`, NI jeton : voir le commentaire de tête.
      colonnes: ['id', 'name', 'email', 'role', 'statut', 'telephone', 'cree_le'],
      lire: (page: number) =>
        this.db.user.findMany({
          orderBy: { id: 'desc' },
          skip: (page - 1) * PAR_PAGE,
          take: PAR_PAGE,
          select: {
            id: true,
            name: true,
            email: true,
            statut: true,
            telephone: true,
            cree_le: true,
            role: { select: { code: true } },
          },
        }),
      compter: () => this.db.user.count(),
      aplatir: (ligne: Record<string, unknown>) => ({
        ...ligne,
        role: (ligne.role as { code: string } | null)?.code ?? null,
      }),
    },

    avis: {
      libelle: 'Avis',
      // `auteur_contact` est écarté — loi 09-08.
      colonnes: ['id', 'etablissement', 'auteur_nom', 'note', 'statut', 'en_avant', 'depose_le'],
      lire: (page: number) =>
        this.db.avis.findMany({
          orderBy: { id: 'desc' },
          skip: (page - 1) * PAR_PAGE,
          take: PAR_PAGE,
          select: {
            id: true,
            auteur_nom: true,
            note: true,
            statut: true,
            en_avant: true,
            depose_le: true,
            etablissement: { select: { nom: true } },
          },
        }),
      compter: () => this.db.avis.count(),
      aplatir: (ligne: Record<string, unknown>) => ({
        ...ligne,
        etablissement: (ligne.etablissement as { nom: string } | null)?.nom ?? null,
      }),
    },

    articles: {
      libelle: 'Articles',
      colonnes: ['id', 'titre', 'categorie', 'statut', 'a_la_une', 'publie_le', 'cree_le'],
      lire: (page: number) =>
        this.db.article.findMany({
          orderBy: { id: 'desc' },
          skip: (page - 1) * PAR_PAGE,
          take: PAR_PAGE,
          select: {
            id: true,
            titre: true,
            categorie: true,
            statut: true,
            a_la_une: true,
            publie_le: true,
            cree_le: true,
          },
        }),
      compter: () => this.db.article.count(),
      aplatir: (ligne: Record<string, unknown>) => ligne,
    },

    factures: {
      libelle: 'Factures',
      colonnes: ['id', 'numero', 'etablissement', 'total_ttc', 'statut_paiement', 'emise_le'],
      lire: (page: number) =>
        this.db.facture.findMany({
          orderBy: { id: 'desc' },
          skip: (page - 1) * PAR_PAGE,
          take: PAR_PAGE,
          select: {
            id: true,
            numero: true,
            total_ttc: true,
            statut_paiement: true,
            emise_le: true,
            etablissement: { select: { nom: true } },
          },
        }),
      compter: () => this.db.facture.count(),
      aplatir: (ligne: Record<string, unknown>) => ({
        ...ligne,
        etablissement: (ligne.etablissement as { nom: string } | null)?.nom ?? null,
        // Décimal en chaîne, comme partout ailleurs dans l'API.
        total_ttc: String(ligne.total_ttc),
      }),
    },

    leads: {
      libelle: 'Leads',
      colonnes: ['id', 'etablissement', 'candidat_nom', 'ville', 'cycle', 'source', 'cree_le'],
      /**
       * NI TÉLÉPHONE NI ADRESSE ICI. Ce sont les coordonnées d'un parent, et
       * c'est l'établissement propriétaire du lead qui a le droit de les lire
       * (RG23) — l'administration arbitre, elle ne démarche pas. L'écran du
       * lead les montre à qui de droit ; cet explorateur sert à compter et à
       * vérifier, pas à extraire un fichier de prospection.
       */
      lire: (page: number) =>
        this.db.lead.findMany({
          orderBy: { id: 'desc' },
          skip: (page - 1) * PAR_PAGE,
          take: PAR_PAGE,
          select: {
            id: true,
            candidat_nom: true,
            ville: true,
            cycle: true,
            source: true,
            cree_le: true,
            etablissement: { select: { nom: true } },
          },
        }),
      compter: () => this.db.lead.count(),
      aplatir: (ligne: Record<string, unknown>) => ({
        ...ligne,
        etablissement: (ligne.etablissement as { nom: string } | null)?.nom ?? null,
      }),
    },
  } as const;

  /** Les onglets de l'écran — `dbTablesChips`. */
  catalogue() {
    return Object.entries(this.tables).map(([cle, table]) => ({
      cle,
      libelle: table.libelle,
      colonnes: table.colonnes,
    }));
  }

  async lire(cle: string, page: number): Promise<Page<unknown>> {
    const table = this.tables[cle as keyof typeof this.tables];

    /**
     * UNE TABLE INCONNUE EST UN 422, PAS UN 404. Ce n'est pas une ressource
     * absente : c'est un paramètre hors de la liste fermée, et la nuance
     * compte — un 404 inviterait à chercher la bonne orthographe.
     */
    if (!table) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        `Table inconnue. Tables consultables : ${Object.keys(this.tables).join(', ')}.`,
      );
    }

    const demandee = Math.max(1, page);
    const [total, lignes] = await Promise.all([table.compter(), table.lire(demandee)]);

    return new Page(
      lignes.map((ligne) => table.aplatir(ligne as Record<string, unknown>)),
      total,
      demandee,
      PAR_PAGE,
    );
  }
}
