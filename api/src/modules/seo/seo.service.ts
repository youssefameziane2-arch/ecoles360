import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticleStatut, EtablissementStatut } from '../../generated/prisma';

/** Une entrée du plan de site. */
interface Url {
  chemin: string;
  derniere?: Date | null;
  /** Fréquence de révision suggérée — indicative, les moteurs s'en écartent. */
  frequence: 'daily' | 'weekly' | 'monthly';
  priorite: string;
}

/**
 * Plan de site — `GET /sitemap.xml`.
 *
 * POURQUOI ICI ET PAS DANS LE FRONT : le front est une application monopage.
 * Il ne connaît la liste des fiches qu'après un appel réseau, dans le
 * navigateur — trop tard pour un robot d'indexation, qui lit un fichier et
 * s'en va. Seul le serveur peut énumérer ce qui est publiable.
 *
 * RG03 GOUVERNE CE FICHIER. Seules les fiches `validee` y figurent. Une fiche
 * en attente ou refusée qu'on y listerait serait révélée à Google alors que
 * l'API répond 404 à son sujet : on annoncerait publiquement l'existence de ce
 * qu'on refuse de montrer, et on livrerait au moteur une collection de liens
 * morts. Les deux défauts sont silencieux — rien ne les signale côté serveur.
 */
@Injectable()
export class SeoService {
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async planDuSite(): Promise<string> {
    const origine = (this.config.get<string>('APP_URL') ?? '').replace(/\/+$/, '');

    const [etablissements, villes, articles, pages] = await Promise.all([
      this.db.etablissement.findMany({
        where: { statut: EtablissementStatut.validee },
        select: { slug: true, valide_le: true, cree_le: true },
        orderBy: { id: 'asc' },
      }),
      // LES VILLES SANS FICHE VALIDÉE SONT ÉCARTÉES : leur page existe mais
      // n'affiche rien. Une page vide indexée dessert le référencement du
      // reste du site plutôt qu'elle ne l'aide.
      this.db.ville.findMany({
        where: { etablissements: { some: { statut: EtablissementStatut.validee } } },
        select: { slug: true },
        orderBy: { nom: 'asc' },
      }),
      this.db.article.findMany({
        where: { statut: ArticleStatut.approuve, publie_le: { not: null } },
        select: { slug: true, publie_le: true },
        orderBy: { publie_le: 'desc' },
      }),
      this.db.pageCms.findMany({ select: { cle: true, modifiee_le: true } }),
    ]);

    const modifieeLe = (cle: string) => pages.find((p) => p.cle === cle)?.modifiee_le ?? null;

    const urls: Url[] = [
      { chemin: '/', frequence: 'daily', priorite: '1.0' },
      { chemin: '/etablissements', frequence: 'daily', priorite: '0.9' },
      { chemin: '/blog', frequence: 'weekly', priorite: '0.6' },
      { chemin: '/faq', frequence: 'monthly', priorite: '0.5' },
      { chemin: '/inscription-etablissement', frequence: 'monthly', priorite: '0.7' },
      {
        chemin: '/a-propos',
        derniere: modifieeLe('a-propos'),
        frequence: 'monthly',
        priorite: '0.4',
      },

      ...villes.map((ville): Url => ({
        chemin: `/villes/${ville.slug}`,
        frequence: 'weekly',
        priorite: '0.8',
      })),

      // Le cœur de l'annuaire : c'est sur ces pages que se joue tout le
      // trafic de recherche.
      ...etablissements.map((etablissement): Url => ({
        chemin: `/etablissements/${etablissement.slug}`,
        // Faute de colonne de dernière modification sur la fiche, la date de
        // validation est la plus juste dont on dispose — mieux vaut une date
        // vraie mais ancienne qu'une date d'aujourd'hui qui ferait repasser
        // le robot pour rien.
        derniere: etablissement.valide_le ?? etablissement.cree_le,
        frequence: 'weekly',
        priorite: '0.8',
      })),

      ...articles.map((article): Url => ({
        chemin: `/blog/${article.slug}`,
        derniere: article.publie_le,
        frequence: 'monthly',
        priorite: '0.5',
      })),

      // Les pages légales comptent peu pour la recherche, mais leur présence
      // au plan de site est un signal de sérieux, et la loi 09-08 veut
      // qu'elles soient trouvables (RG09).
      ...['mentions-legales', 'confidentialite', 'cookies'].map((cle): Url => ({
        chemin: `/${cle}`,
        derniere: modifieeLe(cle),
        frequence: 'monthly',
        priorite: '0.2',
      })),
    ];

    const lignes = urls.map((url) => {
      const date = url.derniere ? `\n    <lastmod>${iso(url.derniere)}</lastmod>` : '';

      return (
        `  <url>\n` +
        `    <loc>${echapper(origine + url.chemin)}</loc>${date}\n` +
        `    <changefreq>${url.frequence}</changefreq>\n` +
        `    <priority>${url.priorite}</priority>\n` +
        `  </url>`
      );
    });

    return (
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `${lignes.join('\n')}\n` +
      `</urlset>\n`
    );
  }
}

/** `lastmod` veut une date seule, pas un horodatage. */
const iso = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Les slugs sont fabriqués par l'application et ne contiennent que des
 * minuscules et des tirets. L'échappement n'en est pas moins fait : le jour où
 * un slug viendra d'un import, une esperluette suffirait à rendre le fichier
 * illisible — et un plan de site mal formé est rejeté en entier, sans
 * avertissement.
 */
const echapper = (texte: string) =>
  texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
