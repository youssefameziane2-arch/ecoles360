import { Injectable } from '@nestjs/common';
import { Page } from '../../common/interceptors';
import { PrismaService } from '../../prisma/prisma.service';
import { EvenementType, type Prisma } from '../../generated/prisma';

/** Entrées par page du journal — la maquette en montre une liste continue. */
const PAR_PAGE = 25;

/**
 * Lecture du journal d'audit — livrable 11 §3.6, RG15, RG26.
 *
 * LECTURE SEULE, ET C'EST UNE RÈGLE, PAS UNE OMISSION. `AuditService` écrit,
 * ce service lit, et aucune route `PATCH` ni `DELETE` n'existe sur le journal
 * (RG26). Un registre qu'on peut retoucher ne prouve rien : c'est précisément
 * parce qu'il est immuable qu'il sert à départager un établissement qui
 * conteste le rejet de son avis.
 *
 * TROIS BLOCS, comme l'écran de la maquette : l'activité par profil, les
 * statistiques par établissement, et le journal lui-même.
 */
@Injectable()
export class AuditLectureService {
  constructor(private readonly db: PrismaService) {}

  /**
   * Entrées du journal, les plus récentes d'abord.
   *
   * Filtrables par rôle et par préfixe d'action (`avis`, `article`,
   * `etablissement`…) : la maquette pose des pastilles au-dessus de la liste,
   * et sans elles un journal de plusieurs milliers de lignes est illisible.
   */
  async lister(filtres: {
    role?: string;
    domaine?: string;
    page?: number;
  }): Promise<Page<unknown>> {
    const page = Math.max(1, filtres.page ?? 1);

    const where: Prisma.JournalAuditWhereInput = {
      ...(filtres.role ? { role_acteur: filtres.role } : {}),
      // Le préfixe avant le point est le domaine métier : `avis.rejete`,
      // `article.approuve`, `etablissement.valide`.
      ...(filtres.domaine ? { action: { startsWith: `${filtres.domaine}.` } } : {}),
    };

    const [total, entrees] = await Promise.all([
      this.db.journalAudit.count({ where }),
      this.db.journalAudit.findMany({
        where,
        orderBy: { cree_le: 'desc' },
        skip: (page - 1) * PAR_PAGE,
        take: PAR_PAGE,
        select: {
          id: true,
          role_acteur: true,
          action: true,
          cible_type: true,
          cible_id: true,
          severite: true,
          details: true,
          cree_le: true,
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

    return new Page(entrees, total, page, PAR_PAGE);
  }

  /** Domaines présents dans le journal — alimente les pastilles de filtre. */
  async domaines(): Promise<string[]> {
    const actions = await this.db.journalAudit.findMany({
      distinct: ['action'],
      select: { action: true },
    });

    return [...new Set(actions.map((a) => a.action.split('.')[0] ?? a.action))].sort();
  }

  /**
   * Les deux tableaux de tête de l'écran.
   *
   * L'ACTIVITÉ PAR PROFIL COMPTE LE MOIS COURANT, comme le dit la maquette
   * (« Actions enregistrées ce mois-ci ») : un cumul depuis l'origine
   * écraserait les barres et ne dirait plus rien d'un mois à l'autre.
   */
  async statistiques() {
    const debutDuMois = new Date();
    debutDuMois.setDate(1);
    debutDuMois.setHours(0, 0, 0, 0);

    const [parProfil, etablissements] = await Promise.all([
      this.db.journalAudit.groupBy({
        by: ['role_acteur'],
        where: { cree_le: { gte: debutDuMois } },
        _count: { _all: true },
      }),
      this.db.etablissement.findMany({
        orderBy: { nom: 'asc' },
        select: { id: true, nom: true, slug: true, nb_avis: true, note_moy: true },
      }),
    ]);

    const traces = await this.db.evenementTrace.groupBy({
      by: ['etablissement_id', 'type'],
      _count: { _all: true },
    });

    const contacts = await this.db.demandeContact.groupBy({
      by: ['etablissement_id'],
      _count: { _all: true },
    });

    const compte = (id: bigint, types: EvenementType[]) =>
      traces
        .filter((t) => t.etablissement_id === id && types.includes(t.type))
        .reduce((total, t) => total + t._count._all, 0);

    return {
      activite_par_profil: parProfil
        .map((ligne) => ({ role: ligne.role_acteur, actions: ligne._count._all }))
        .sort((a, b) => b.actions - a.actions),

      par_etablissement: etablissements.map((etablissement) => ({
        id: etablissement.id.toString(),
        nom: etablissement.nom,
        slug: etablissement.slug,
        // « Vues » regroupe les vues simples et sponsorisées : la distinction
        // sert à la facturation (RG18), pas à cet écran de suivi.
        vues: compte(etablissement.id, [EvenementType.vue, EvenementType.vue_sponsorisee]),
        clics: compte(etablissement.id, [EvenementType.appel, EvenementType.whatsapp]),
        contacts: contacts.find((c) => c.etablissement_id === etablissement.id)?._count._all ?? 0,
        avis: etablissement.nb_avis,
        note: etablissement.note_moy,
      })),
    };
  }
}
