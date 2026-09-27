import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  chargerArticleALaUne,
  chargerArticles,
  chargerCategoriesArticles,
  type CarteArticle,
} from '@/api/articles';
import { SkeletonCard } from '@/ds/composants';
import { formaterDate } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

/** Toutes les catégories — première pastille de la maquette. */
const TOUTES = 'Tous';

/**
 * Blog — écran `isBlog` de la maquette.
 *
 * TROIS BLOCS, DANS CET ORDRE : un article à la une en bandeau large, les
 * pastilles de catégorie, puis la grille. L'article à la une est exclu de la
 * grille côté serveur — l'afficher deux fois donnerait l'impression d'un
 * doublon, pas d'une mise en avant.
 */
export function Blog() {
  const [categorie, setCategorie] = useState<string>(TOUTES);

  useTitrePage(
    'Blog — conseils et guides pour les parents',
    'Tout pour choisir, comprendre et accompagner la scolarité de votre enfant au Maroc.',
  );

  const une = useQuery({ queryKey: ['articles', 'une'], queryFn: chargerArticleALaUne });
  const categories = useQuery({
    queryKey: ['articles', 'categories'],
    queryFn: chargerCategoriesArticles,
  });
  const articles = useQuery({
    queryKey: ['articles', categorie],
    queryFn: () => chargerArticles(categorie === TOUTES ? {} : { categorie }),
  });

  const pastilles = [TOUTES, ...(categories.data ?? [])];

  return (
    <div>
      <section
        style={{ maxWidth: 1180, margin: '0 auto', padding: '52px 32px 0', textAlign: 'center' }}
      >
        <div
          style={{
            font: "700 12px/1 'Inter', sans-serif",
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: '#E63946',
            marginBottom: 10,
          }}
        >
          Le blog écoles360
        </div>
        <h1 style={{ margin: 0, font: "800 40px/1.1 'Inter', sans-serif", letterSpacing: '-1px' }}>
          Conseils &amp; guides pour les parents
        </h1>
        <p
          style={{
            margin: '14px auto 0',
            font: "400 17px/1.55 'Inter', sans-serif",
            color: '#5A6472',
            maxWidth: 560,
          }}
        >
          Tout pour choisir, comprendre et accompagner la scolarité de votre enfant au Maroc.
        </p>
      </section>

      {une.data && (
        <section style={{ maxWidth: 1180, margin: '40px auto 0', padding: '0 32px' }}>
          <Link
            to={`/blog/${une.data.slug}`}
            className="e3-card e3-blog-une"
            style={{
              display: 'grid',
              background: '#fff',
              border: '1px solid #EAE6DE',
              borderRadius: 20,
              overflow: 'hidden',
              color: 'inherit',
            }}
          >
            <Visuel chemin={une.data.image_chemin} hauteurMinimale={340} />

            <div
              style={{
                padding: 40,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Pastille>{une.data.categorie}</Pastille>
                <span style={{ font: "400 12.5px/1 'Inter', sans-serif", color: '#9AA3AF' }}>
                  À la une
                </span>
              </div>
              <h2
                style={{
                  margin: 0,
                  font: "800 28px/1.18 'Inter', sans-serif",
                  letterSpacing: '-0.6px',
                }}
              >
                {une.data.titre}
              </h2>
              {une.data.chapeau && (
                <p
                  style={{
                    margin: '14px 0 20px',
                    font: "400 15.5px/1.6 'Inter', sans-serif",
                    color: '#5A6472',
                  }}
                >
                  {une.data.chapeau}
                </p>
              )}
              <Signature article={une.data} />
            </div>
          </Link>
        </section>
      )}

      {pastilles.length > 1 && (
        <section style={{ maxWidth: 1180, margin: '40px auto 0', padding: '0 32px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {pastilles.map((nom) => {
              const actif = nom === categorie;

              return (
                <button
                  key={nom}
                  type="button"
                  onClick={() => setCategorie(nom)}
                  aria-pressed={actif}
                  style={{
                    cursor: 'pointer',
                    background: actif ? '#1D3557' : '#fff',
                    color: actif ? '#fff' : '#5A6472',
                    border: `1px solid ${actif ? '#1D3557' : '#EAE6DE'}`,
                    font: "600 13.5px/1 'Inter', sans-serif",
                    padding: '9px 18px',
                    borderRadius: 20,
                    transition: 'all .15s ease',
                  }}
                >
                  {nom}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section style={{ maxWidth: 1180, margin: '32px auto 0', padding: '0 32px' }}>
        {articles.isPending && (
          <div className="e3-blog-grille">
            {[0, 1, 2].map((rang) => (
              <SkeletonCard key={rang} />
            ))}
          </div>
        )}

        {articles.data?.data.length === 0 && (
          <div
            style={{
              background: '#fff',
              border: '1px solid #EAE6DE',
              borderRadius: 16,
              padding: 44,
              textAlign: 'center',
              font: "400 14px/1.6 'Inter', sans-serif",
              color: '#9AA3AF',
            }}
          >
            Aucun article dans cette catégorie.
          </div>
        )}

        <div className="e3-blog-grille">
          {articles.data?.data.map((article) => (
            <CarteBlog key={article.id} article={article} />
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '64px auto 90px', padding: '0 32px' }}>
        <div
          style={{
            background: '#1D3557',
            borderRadius: 20,
            padding: 48,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: -40,
              bottom: -60,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(230,57,70,.12)',
            }}
          />
          <h2
            style={{
              margin: 0,
              color: '#fff',
              font: "800 26px/1.2 'Inter', sans-serif",
              letterSpacing: '-0.5px',
              position: 'relative',
            }}
          >
            Une question sur la scolarité de votre enfant&nbsp;?
          </h2>
          <p
            style={{
              margin: '12px auto 24px',
              color: '#AFC0D6',
              font: "400 15.5px/1.55 'Inter', sans-serif",
              maxWidth: 460,
              position: 'relative',
            }}
          >
            {/*
              LA MAQUETTE MET ICI UNE INSCRIPTION À UNE INFOLETTRE. Elle n'est
              pas branchée : collecter des adresses sans envoi réel, sans
              consentement tracé ni désinscription, contreviendrait à la loi
              09-08 (RG09). Le bloc renvoie donc vers la FAQ, qui répond
              vraiment, tant que l'infolettre n'existe pas.
            */}
            Nos réponses aux questions que les parents nous posent le plus souvent.
          </p>
          <Link
            to="/faq"
            style={{
              position: 'relative',
              display: 'inline-block',
              background: '#E63946',
              color: '#fff',
              font: "600 15px/1 'Inter', sans-serif",
              padding: '14px 24px',
              borderRadius: 11,
            }}
          >
            Consulter la FAQ
          </Link>
        </div>
      </section>
    </div>
  );
}

/**
 * Carte d'article de la grille — 180 px de visuel, chapeau, date.
 *
 * `afficherChapeau` à faux pour l'aperçu de l'accueil : la maquette y dessine
 * la même carte sans chapeau, et trois chapeaux de longueurs inégales y
 * désaligneraient les dates.
 */
export function CarteBlog({
  article,
  afficherChapeau = true,
}: {
  article: CarteArticle;
  afficherChapeau?: boolean;
}) {
  return (
    <Link
      to={`/blog/${article.slug}`}
      className="e3-card"
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        color: 'inherit',
      }}
    >
      <Visuel chemin={article.image_chemin} hauteur={180} />

      <div
        style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}
      >
        <span
          style={{
            alignSelf: 'flex-start',
            background: '#F1F3F6',
            color: '#5A6472',
            font: "600 11.5px/1 'Inter', sans-serif",
            padding: '5px 11px',
            borderRadius: 20,
          }}
        >
          {article.categorie}
        </span>
        <h3
          style={{ margin: 0, font: "700 18px/1.3 'Inter', sans-serif", letterSpacing: '-0.3px' }}
        >
          {article.titre}
        </h3>
        {afficherChapeau && article.chapeau && (
          <p style={{ margin: 0, font: "400 14px/1.55 'Inter', sans-serif", color: '#5A6472' }}>
            {article.chapeau}
          </p>
        )}
        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <Signature article={article} />
        </div>
      </div>
    </Link>
  );
}

/**
 * Visuel d'un article.
 *
 * AUCUNE IMAGE N'EST ENCORE TÉLÉVERSÉE : `image_chemin` est toujours nul en
 * l'état. Plutôt qu'un cadre gris vide, on pose l'aplat sable du design system
 * avec l'initiale de la catégorie — la carte garde sa silhouette, et rien ne
 * donne l'impression d'un visuel cassé.
 */
function Visuel({
  chemin,
  hauteur,
  hauteurMinimale,
}: {
  chemin: string | null;
  hauteur?: number;
  hauteurMinimale?: number;
}) {
  return (
    <div
      style={{
        height: hauteur,
        minHeight: hauteurMinimale,
        background: chemin ? `#E3E7EC url('${chemin}') center/cover` : '#F1ECE3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!chemin && (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#C9C0AC" strokeWidth="1.6" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 15 5-4 4 3 3-2 6 5" />
          <circle cx="8.5" cy="9.5" r="1.5" />
        </svg>
      )}
    </div>
  );
}

function Pastille({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        background: '#FBE9EA',
        color: '#E63946',
        font: "600 12px/1 'Inter', sans-serif",
        padding: '6px 12px',
        borderRadius: 20,
      }}
    >
      {children}
    </span>
  );
}

/** Date et, pour un article d'établissement, la signature de son auteur. */
function Signature({ article }: { article: CarteArticle }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        font: "400 12.5px/1.4 'Inter', sans-serif",
        color: '#9AA3AF',
        flexWrap: 'wrap',
      }}
    >
      {article.publie_le && <span>{formaterDate(article.publie_le)}</span>}
      {article.etablissement && (
        <>
          <span>·</span>
          <span style={{ color: '#1D3557', fontWeight: 600 }}>{article.etablissement.nom}</span>
        </>
      )}
    </div>
  );
}
