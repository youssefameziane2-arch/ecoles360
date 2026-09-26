import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  LIBELLE_TYPE,
  chargerVille,
  chargerVilles,
  rechercherEtablissements,
  type TypeEtablissement,
} from '@/api/etablissements';
import { CityCard, EstablishmentCard, Icon } from '@/ds/composants';
import { formaterMad, formaterNombre, formaterNote } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

/** Icône du design system associée à chaque type (RG02) — même table que l'accueil. */
const ICONE_TYPE: Record<TypeEtablissement, string> = {
  creche: 'baby',
  primaire: 'book-open',
  college: 'building',
  lycee: 'graduation-cap',
  universite: 'users',
  // Pas d'icône « grande école » au design system : `star` distingue
  // visuellement les écoles supérieures des facultés sans inventer un glyphe.
  superieur: 'star',
  formation: 'briefcase',
};

const TYPES = Object.keys(LIBELLE_TYPE) as TypeEtablissement[];

/**
 * Page d'une ville — écran `isVille` de la maquette.
 *
 * ELLE EXISTE POUR LE RÉFÉRENCEMENT, pas pour la navigation interne. Un parent
 * qui cherche « école privée Casablanca » doit tomber sur une page qui porte
 * ce titre, ces chiffres et ces quartiers — pas sur une recherche filtrée dont
 * l'URL ne dit rien à un moteur.
 *
 * LES CHIFFRES VIENNENT DE L'API, PAS DE LA PAGE DE RÉSULTATS : `/villes/:slug`
 * agrège toute la ville, alors qu'une recherche n'en rend que dix-huit fiches.
 */
export function Ville() {
  const { slug = '' } = useParams();
  const naviguer = useNavigate();

  const ville = useQuery({
    queryKey: ['ville', slug],
    queryFn: () => chargerVille(slug),
    enabled: Boolean(slug),
  });

  const etablissements = useQuery({
    queryKey: ['etablissements', 'ville', slug],
    queryFn: () => rechercherEtablissements({ ville: slug, per_page: 8 }),
    enabled: Boolean(slug),
  });

  const villes = useQuery({ queryKey: ['villes'], queryFn: chargerVilles });

  const v = ville.data;

  useTitrePage(
    v ? `Écoles privées à ${v.nom}` : null,
    v
      ? `${formaterNombre(v.nb_etablissements)} établissements scolaires privés à ${v.nom} : crèches, écoles, collèges, lycées et universités. Comparez et contactez gratuitement.`
      : undefined,
  );

  if (ville.isPending) {
    return <div className="conteneur section">Chargement…</div>;
  }

  if (ville.isError || !v) {
    const introuvable = ville.error instanceof ApiError && ville.error.statut === 404;

    return (
      <div className="conteneur section" style={{ textAlign: 'center', padding: '80px 0' }}>
        <h1 className="titre-section">
          {introuvable ? 'Ville introuvable' : 'Une erreur est survenue'}
        </h1>
        <p className="sous-titre-section">
          {introuvable
            ? 'Cette ville ne fait pas partie des villes couvertes au lancement.'
            : 'Rechargez la page ; si le problème persiste, réessayez plus tard.'}
        </p>
        <Link to="/etablissements" style={boutonRouge}>
          Voir tous les établissements
        </Link>
      </div>
    );
  }

  const autresVilles = (villes.data ?? []).filter((autre) => autre.slug !== v.slug).slice(0, 5);
  const comptesParType = new Map(v.par_type.map((ligne) => [ligne.type, ligne.total]));

  return (
    <>
      {/* ---- Héros ------------------------------------------------------ */}
      <section style={{ position: 'relative', height: 380, overflow: 'hidden', background: 'var(--e360-navy)' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(15,26,45,.35) 0%, rgba(15,26,45,.82) 100%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            maxWidth: 1180,
            margin: '0 auto',
            padding: '0 32px 44px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,.75)', marginBottom: 14 }}>
            <Link to="/" style={{ color: 'inherit' }}>
              Accueil
            </Link>
            <span>›</span>
            <span style={{ color: '#fff' }}>{v.nom}</span>
          </div>

          <h1 className="e3-hero-titre" style={{ margin: 0, color: '#fff', fontSize: 46, fontWeight: 800, letterSpacing: '-1.2px' }}>
            Écoles privées à {v.nom}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14, color: 'rgba(255,255,255,.9)', fontSize: 15, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Icon name="building" size={17} color="#fff" />
              {formaterNombre(v.nb_etablissements)} établissement{v.nb_etablissements > 1 ? 's' : ''}
            </span>
            {v.note_moyenne && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span style={{ color: '#E9A23B' }} aria-hidden>
                  ★
                </span>
                {formaterNote(v.note_moyenne)} de moyenne
              </span>
            )}
            {v.quartiers.length > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Icon name="map-pin" size={16} color="#fff" />
                {v.quartiers.length} quartier{v.quartiers.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ---- Introduction ------------------------------------------------ */}
      <section style={{ maxWidth: 1180, margin: '36px auto 0', padding: '0 32px' }}>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.7, color: '#3A424E', maxWidth: 820 }}>
          {v.nb_etablissements === 0
            ? `Aucun établissement n’est encore publié à ${v.nom}. Les fiches sont vérifiées avant publication : revenez bientôt, ou explorez les autres villes.`
            : `Retrouvez les établissements scolaires privés de ${v.nom}${v.region ? ` (${v.region})` : ''} : crèches, écoles primaires, collèges, lycées, universités et centres de formation. Chaque fiche est vérifiée avant publication, et vous contactez l’établissement gratuitement, sans créer de compte.`}
        </p>
      </section>

      {/* ---- Par type ---------------------------------------------------- */}
      <section style={{ maxWidth: 1180, margin: '36px auto 0', padding: '0 32px' }}>
        <h2 style={titreSection}>Par type d’établissement</h2>
        <div className="e3-typegrid">
          {TYPES.map((type) => {
            const total = comptesParType.get(type) ?? 0;

            return (
              <Link
                key={type}
                to={`/etablissements?ville=${v.slug}&type=${type}`}
                style={{
                  background: '#fff',
                  border: '1.5px solid #EAE6DE',
                  borderRadius: 14,
                  padding: '18px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 9,
                  textAlign: 'center',
                  opacity: total === 0 ? 0.55 : 1,
                }}
              >
                <span style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={ICONE_TYPE[type]} size={24} color="var(--e360-red)" />
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>
                  {LIBELLE_TYPE[type]}
                </span>
                <span style={{ fontSize: 12, color: '#9AA3AF' }}>
                  {total} école{total > 1 ? 's' : ''}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---- Les établissements ------------------------------------------ */}
      {v.nb_etablissements > 0 && (
        <section style={{ maxWidth: 1180, margin: '44px auto 0', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
            <h2 style={{ ...titreSection, marginBottom: 0, fontSize: 24 }}>
              Tous les établissements à {v.nom}
            </h2>
            <Link
              to={`/etablissements?ville=${v.slug}`}
              style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 15, fontWeight: 600, color: 'var(--e360-navy)' }}
            >
              Voir avec filtres <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="e3-featgrid">
            {etablissements.data?.data.map((fiche) => (
              <EstablishmentCard
                key={fiche.id}
                name={fiche.nom}
                city={fiche.quartier ? `${fiche.quartier}, ${fiche.ville.nom}` : fiche.ville.nom}
                type={LIBELLE_TYPE[fiche.type]}
                rating={formaterNote(fiche.note_moy)}
                reviews={fiche.nb_avis}
                image={fiche.photo?.chemin ?? null}
                sponsored={fiche.sponsorise}
                verified={fiche.verifie}
                price={
                  fiche.budget_min && fiche.budget_max
                    ? `${formaterMad(fiche.budget_min)} – ${formaterMad(fiche.budget_max)} / an`
                    : null
                }
                onView={() => naviguer(`/etablissements/${fiche.slug}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---- Quartiers ---------------------------------------------------- */}
      {v.quartiers.length > 0 && (
        <section style={{ maxWidth: 1180, margin: '44px auto 0', padding: '0 32px' }}>
          <h2 style={titreSection}>Quartiers</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {v.quartiers.map((quartier) => (
              <Link
                key={quartier}
                to={`/etablissements?ville=${v.slug}&q=${encodeURIComponent(quartier)}`}
                style={{
                  background: '#fff',
                  border: '1px solid #EAE6DE',
                  color: '#3A424E',
                  fontSize: 14,
                  fontWeight: 500,
                  padding: '9px 16px',
                  borderRadius: 20,
                }}
              >
                {quartier}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---- Autres villes ------------------------------------------------ */}
      {autresVilles.length > 0 && (
        <section style={{ maxWidth: 1180, margin: '56px auto 90px', padding: '0 32px' }}>
          <h2 style={{ ...titreSection, fontSize: 24 }}>Explorez d’autres villes</h2>
          <div className="e3-villegrid">
            {autresVilles.map((autre) => (
              <CityCard
                key={autre.id}
                city={autre.nom}
                count={autre.nb_etablissements}
                height={130}
                onClick={() => naviguer(`/villes/${autre.slug}`)}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

const titreSection: React.CSSProperties = {
  margin: '0 0 18px',
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.5px',
};

const boutonRouge: React.CSSProperties = {
  font: "600 14px/1 'Inter', sans-serif",
  color: '#fff',
  background: '#E63946',
  borderRadius: 10,
  padding: '12px 20px',
  display: 'inline-block',
};
