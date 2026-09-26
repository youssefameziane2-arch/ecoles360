import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { chargerArticle } from '@/api/articles';
import { CarteBlog } from './Blog';
import { formaterDate } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

/**
 * Page d'un article — écran `isArticle` de la maquette.
 *
 * COLONNE DE 760 px POUR LE TEXTE, 920 pour le visuel : c'est la mesure de la
 * maquette, et elle n'est pas décorative — au-delà d'une centaine de caractères
 * par ligne, l'œil perd le début de la ligne suivante.
 */
export function Article() {
  const { slug = '' } = useParams();

  const article = useQuery({
    queryKey: ['article', slug],
    queryFn: () => chargerArticle(slug),
    enabled: Boolean(slug),
    retry: (echecs, erreur) => !(erreur instanceof ApiError && erreur.statut === 404) && echecs < 2,
  });

  const a = article.data;

  useTitrePage(a?.titre ?? null, a?.chapeau ?? undefined);

  if (article.isError) {
    return (
      <div className="conteneur section" style={{ maxWidth: 760 }}>
        <h1 className="titre-section">Article introuvable</h1>
        <p className="sous-titre-section">
          Cet article n&rsquo;existe pas ou n&rsquo;est plus publié.{' '}
          <Link to="/blog" style={{ color: '#E63946', fontWeight: 600 }}>
            Retour au blog
          </Link>
        </p>
      </div>
    );
  }

  if (!a) {
    return (
      <div className="conteneur section" style={{ maxWidth: 760 }}>
        <p style={{ font: "400 15px/1.6 'Inter', sans-serif", color: '#5A6472' }}>Chargement…</p>
      </div>
    );
  }

  return (
    <div>
      <article style={{ maxWidth: 760, margin: '0 auto', padding: '32px 32px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            font: "400 13px/1 'Inter', sans-serif",
            color: '#9AA3AF',
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <Link to="/" style={{ color: '#9AA3AF' }}>
            Accueil
          </Link>
          <span>›</span>
          <Link to="/blog" style={{ color: '#9AA3AF' }}>
            Blog
          </Link>
          <span>›</span>
          <span style={{ color: '#5A6472' }}>{a.categorie}</span>
        </div>

        <span
          style={{
            display: 'inline-block',
            background: '#FBE9EA',
            color: '#E63946',
            font: "600 12px/1 'Inter', sans-serif",
            padding: '6px 12px',
            borderRadius: 20,
            marginBottom: 16,
          }}
        >
          {a.categorie}
        </span>

        <h1
          style={{
            margin: 0,
            font: "800 38px/1.12 'Inter', sans-serif",
            letterSpacing: '-1px',
          }}
        >
          {a.titre}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 22 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: a.etablissement ? '#1D3557' : '#E63946',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              font: "700 15px/1 'Inter', sans-serif",
              flex: 'none',
            }}
          >
            {initiales(a.etablissement?.nom ?? a.auteur?.name ?? 'écoles360')}
          </div>
          <div>
            <div style={{ font: "700 14.5px/1.3 'Inter', sans-serif" }}>
              {a.etablissement?.nom ?? a.auteur?.name ?? 'écoles360'}
            </div>
            <div style={{ font: "400 13px/1.4 'Inter', sans-serif", color: '#9AA3AF' }}>
              {a.publie_le && formaterDate(a.publie_le)}
              {a.contenu && ` · ${dureeDeLecture(a.contenu)} de lecture`}
            </div>
          </div>
        </div>
      </article>

      {a.image_chemin && (
        <div style={{ maxWidth: 920, margin: '32px auto 0', padding: '0 32px' }}>
          <div
            style={{
              height: 420,
              borderRadius: 18,
              background: `#E3E7EC url('${a.image_chemin}') center/cover`,
            }}
          />
        </div>
      )}

      <article style={{ maxWidth: 760, margin: '36px auto 0', padding: '0 32px' }}>
        {a.chapeau && (
          <p
            style={{
              margin: '0 0 26px',
              font: "400 19px/1.6 'Inter', sans-serif",
              color: '#1A1A1A',
            }}
          >
            {a.chapeau}
          </p>
        )}

        {/*
          LE CORPS EST DU TEXTE BRUT, découpé sur les lignes vides. L'éditeur de
          l'espace établissement est un `textarea` : accepter du HTML ici
          ouvrirait une injection de script sur une page publique, pour un
          bénéfice typographique nul.
        */}
        {(a.contenu ?? '')
          .split(/\n{2,}/)
          .map((paragraphe) => paragraphe.trim())
          .filter(Boolean)
          .map((paragraphe, rang) => (
            <p
              key={rang}
              style={{
                margin: '0 0 22px',
                font: "400 16px/1.8 'Inter', sans-serif",
                color: '#3A424E',
              }}
            >
              {paragraphe}
            </p>
          ))}

        {!a.contenu && (
          <p style={{ font: "400 15px/1.7 'Inter', sans-serif", color: '#9AA3AF' }}>
            Le corps de cet article n&rsquo;a pas encore été rédigé.
          </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '22px 0',
            borderTop: '1px solid #EAE6DE',
            borderBottom: '1px solid #EAE6DE',
            margin: '26px 0 48px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ font: "600 14px/1 'Inter', sans-serif", color: '#5A6472' }}>
            Partager :
          </span>
          <div style={{ display: 'flex', gap: 9 }}>
            <LienPartage
              libelle="Partager sur WhatsApp"
              url={`https://wa.me/?text=${encodeURIComponent(`${a.titre} — ${lienCourant()}`)}`}
            />
            <LienPartage
              libelle="Partager sur Facebook"
              url={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(lienCourant())}`}
            />
            <LienPartage
              libelle="Envoyer par e-mail"
              url={`mailto:?subject=${encodeURIComponent(a.titre)}&body=${encodeURIComponent(lienCourant())}`}
            />
          </div>
        </div>
      </article>

      {a.a_lire_aussi.length > 0 && (
        <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px 90px' }}>
          <h2
            style={{
              margin: '0 0 22px',
              font: "800 24px/1.2 'Inter', sans-serif",
              letterSpacing: '-0.5px',
            }}
          >
            À lire aussi
          </h2>
          <div className="e3-blog-grille">
            {a.a_lire_aussi.map((autre) => (
              <CarteBlog key={autre.id} article={autre} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Pastille de partage — navy plein, comme la maquette. */
function LienPartage({ libelle, url }: { libelle: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={libelle}
      title={libelle}
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: '#1D3557',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
      </svg>
    </a>
  );
}

function lienCourant(): string {
  return typeof window === 'undefined' ? '' : window.location.href;
}

function initiales(nom: string): string {
  return nom
    .split(/\s+/)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Durée de lecture, à 200 mots par minute.
 *
 * La maquette affiche « 6 min de lecture » sur chaque article. La valeur est
 * calculée et non saisie : un chiffre rédigé à la main se désynchronise du
 * texte dès la première correction.
 */
function dureeDeLecture(contenu: string): string {
  const mots = contenu.trim().split(/\s+/).length;

  return `${Math.max(1, Math.round(mots / 200))} min`;
}
