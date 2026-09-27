import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  chargerTableauDeBordAdmin,
  type Comparaison,
  type FileATraiter,
  type TableauDeBordAdmin as Donnees,
} from '@/api/admin';
import { libelleAction, LIBELLE_ROLE_ACTEUR, type EntreeAudit } from '@/api/audit';
import { LIBELLE_TYPE } from '@/api/etablissements';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { CourbeVues } from '@/components/CourbeVues';
import { Icon } from '@/ds/composants';
import { formaterDate, formaterDepuis, formaterNombre, formaterNote } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

/**
 * Tableau de bord de l'administration — maquette `isAdminDash`.
 *
 * QUATRE BLOCS SUR SIX. Le pipeline CRM et les derniers encaissements
 * attendent des routes qui n'existent pas encore, et « Encaisser » est une
 * écriture soumise à la RG14 : ils ne sont pas dessinés à vide, ils sont
 * absents (BACKLOG). La tuile « Recherches effectuées » aussi — aucune trace
 * ne les compte, et un zéro affiché mentirait.
 */
export function TableauDeBordAdmin() {
  useTitrePage('Tableau de bord');

  return (
    <AvecIdentite
      role={['superadmin']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Tableau de bord"
          sousTitre="Vue d’ensemble de la plateforme écoles360"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const donnees = useQuery({
    queryKey: ['admin', 'tableau-de-bord'],
    queryFn: chargerTableauDeBordAdmin,
  });

  if (donnees.isPending) {
    return <p style={{ fontSize: 14, color: '#9AA3AF' }}>Chargement du tableau de bord…</p>;
  }

  if (donnees.isError) {
    return (
      <p role="alert" style={{ fontSize: 14, color: 'var(--e360-red)' }}>
        Le tableau de bord n&rsquo;a pas pu être chargé. Rechargez la page.
      </p>
    );
  }

  const tableau = donnees.data;

  return (
    <>
      <div className="e-2col">
        <Carte titre="Activité récente">
          <ActiviteRecente entrees={tableau.activite} />
        </Carte>
        <Carte titre="À traiter">
          <ATraiter files={tableau.a_traiter} />
        </Carte>
      </div>

      <div className="e-2col" style={{ marginTop: 20 }}>
        <Carte
          titre="Visites du site"
          droite={
            <Link to="/admin/statistiques" style={{ fontSize: 13, color: '#E63946', fontWeight: 600 }}>
              Statistiques →
            </Link>
          }
        >
          <Visites visites={tableau.visites} jours={tableau.fenetre_jours} />
        </Carte>
        <Carte
          titre="Top établissements"
          droite={<span style={{ fontSize: 12, color: '#9AA3AF' }}>Vues · {tableau.fenetre_jours} jours</span>}
        >
          <TopEtablissements lignes={tableau.top_etablissements} jours={tableau.fenetre_jours} />
        </Carte>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
//  Activité récente
// ---------------------------------------------------------------------------

type Teinte = { fond: string; encre: string };

const NAVY: Teinte = { fond: '#E7EDF5', encre: '#1D3557' };
const VERT: Teinte = { fond: '#E6F4EC', encre: '#2E9E5B' };
const ROUGE: Teinte = { fond: '#FDE8EA', encre: '#E63946' };
const AMBRE: Teinte = { fond: '#FCF1DE', encre: '#B57708' };

/** Glyphe par domaine métier — le préfixe de l'action (`avis.rejete`). */
const ICONE_DOMAINE: Record<string, string> = {
  etablissement: 'building',
  proposition_fiche: 'pencil',
  avis: 'star',
  article: 'book-open',
  blog: 'book-open',
  faq: 'message-circle',
  sponsoring: 'flag',
  parametre_facturation: 'credit-card',
  facture: 'credit-card',
  compte: 'users',
};

/**
 * Teinte selon l'ISSUE de l'action, pas son domaine : l'œil doit voir d'un
 * coup ce qui a été refusé ou retiré, quel que soit l'objet concerné.
 */
function teinteDe(action: string): Teinte {
  const issue = action.split('.').pop() ?? '';

  if (/^(rejete|refuse|refusee|suspendu|supprime|supprimee|arrete)$/.test(issue)) return ROUGE;
  if (/^(valide|approuve|approuvee|publie|reactive|encaissee)$/.test(issue)) return VERT;
  if (action.startsWith('facture.') || action.startsWith('parametre_facturation.')) return AMBRE;

  return NAVY;
}

/** Ce sur quoi porte l'action — même lecture que l'écran « Journal d'audit ». */
function cibleDe(entree: EntreeAudit): string | null {
  const details = entree.details ?? {};

  for (const cle of ['titre', 'nom', 'question', 'cle']) {
    const valeur = details[cle];
    if (typeof valeur === 'string') return valeur;
  }

  return null;
}

function ActiviteRecente({ entrees }: { entrees: EntreeAudit[] }) {
  if (entrees.length === 0) {
    return <Vide>Aucune action n&rsquo;a encore été journalisée.</Vide>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {entrees.map((entree) => {
        const teinte = teinteDe(entree.action);
        const cible = cibleDe(entree);

        return (
          <div
            key={entree.id}
            style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 0', borderBottom: '1px solid #F1ECE3' }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: teinte.fond,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
              }}
            >
              <Icon
                name={ICONE_DOMAINE[entree.action.split('.')[0] ?? ''] ?? 'info'}
                size={17}
                color={teinte.encre}
              />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {libelleAction(entree.action)}
                {cible && <span style={{ fontWeight: 400, color: '#5A6472' }}> — {cible}</span>}
              </div>
              <div style={{ fontSize: 12.5, color: '#9AA3AF' }}>
                {entree.user?.name ?? 'Système'} ·{' '}
                {LIBELLE_ROLE_ACTEUR[entree.role_acteur] ?? entree.role_acteur}
              </div>
            </div>
            <span style={{ fontSize: 12, color: '#9AA3AF', whiteSpace: 'nowrap' }}>
              {formaterDepuis(entree.cree_le)}
            </span>
          </div>
        );
      })}

      <Link
        to="/admin/journal"
        style={{ marginTop: 14, fontSize: 13, color: '#E63946', fontWeight: 600, alignSelf: 'flex-start' }}
      >
        Tout le journal →
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  À traiter
// ---------------------------------------------------------------------------

/**
 * Libellés et destinations de chaque file. Les teintes sont celles de la
 * maquette : ambre pour les fiches, rouge pour les avis, navy pour le reste.
 */
const FILES: Record<
  FileATraiter['file'],
  { singulier: string; pluriel: string; cta: string; route: string; fond: string; bord: string; encre: string }
> = {
  propositions: {
    singulier: 'modification de fiche en attente',
    pluriel: 'modifications de fiche en attente',
    cta: 'Valider',
    route: '/admin/propositions',
    fond: '#FCF1DE',
    bord: '#F2DEB0',
    encre: '#B57708',
  },
  avis: {
    singulier: 'avis à modérer',
    pluriel: 'avis à modérer',
    cta: 'Modérer',
    route: '/admin/avis',
    fond: '#FDE8EA',
    bord: '#F4C4CB',
    encre: '#C8313F',
  },
  articles: {
    singulier: 'article soumis à validation',
    pluriel: 'articles soumis à validation',
    cta: 'Relire',
    route: '/admin/blog',
    fond: '#E7EDF5',
    bord: '#CBD9EC',
    encre: '#1D3557',
  },
};

function ATraiter({ files }: { files: FileATraiter[] }) {
  const naviguer = useNavigate();
  // Comme la maquette : une file vide ne fait pas de ligne. Afficher « 0 avis
  // à modérer » en rouge attirerait l'œil sur ce qui ne demande rien.
  const nonVides = files.filter((ligne) => ligne.en_attente > 0);

  if (nonVides.length === 0) {
    return (
      <Vide>
        Rien n&rsquo;attend de décision. Les modifications de fiche, avis et articles soumis
        apparaîtront ici.
      </Vide>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {nonVides.map((ligne) => {
        const file = FILES[ligne.file];

        return (
          <button
            key={ligne.file}
            type="button"
            onClick={() => naviguer(file.route)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: file.fond,
              border: `1px solid ${file.bord}`,
              borderRadius: 11,
              padding: '13px 15px',
              textAlign: 'left',
              fontFamily: 'inherit',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: file.encre }}>
                {formaterNombre(ligne.en_attente)} {ligne.en_attente > 1 ? file.pluriel : file.singulier}
              </div>
              {ligne.plus_ancienne && (
                <div style={{ fontSize: 12.5, color: '#5A6472', marginTop: 2 }}>
                  La plus ancienne attend depuis le {formaterDate(ligne.plus_ancienne)}
                </div>
              )}
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: file.encre, whiteSpace: 'nowrap' }}>
              {file.cta} →
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Visites du site
// ---------------------------------------------------------------------------

/**
 * Écart en pourcentage à la période précédente.
 *
 * NUL QUAND IL N'Y A RIEN À QUOI COMPARER : sur une période précédente à zéro,
 * toute hausse serait « infinie », et afficher « ▲ 100 % » ou « ▲ ∞ »
 * inventerait une tendance qui n'existe pas.
 */
function ecart({ courant, precedent }: Comparaison): number | null {
  if (precedent === 0) return null;
  return Math.round(((courant - precedent) / precedent) * 100);
}

function Visites({ visites, jours }: { visites: Donnees['visites']; jours: number }) {
  const pourcentage = ecart(visites.vues_fiches);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-0.7px', color: '#1D3557', whiteSpace: 'nowrap' }}>
          {formaterNombre(visites.vues_fiches.courant)}
        </span>
        {pourcentage !== null && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: pourcentage >= 0 ? '#2E9E5B' : '#E63946',
              whiteSpace: 'nowrap',
            }}
          >
            {pourcentage >= 0 ? '▲' : '▼'} {Math.abs(pourcentage)} % vs {jours} jours précédents
          </span>
        )}
        <span style={{ fontSize: 12, color: '#9AA3AF' }}>vues de fiches · {jours} derniers jours</span>
      </div>

      {visites.vues_fiches.courant === 0 ? (
        <Vide>Aucune vue de fiche sur la période.</Vide>
      ) : (
        <CourbeVues
          points={visites.vues_par_jour.map((point) => point.vues)}
          libelle="Vues de fiches par jour"
        />
      )}

      {/*
        DEUX TUILES, PAS TROIS. La maquette pose « Recherches effectuées » en
        tête : aucune trace ne les compte (l'enum d'événements s'arrête aux
        vues et aux clics), et la tuile est omise plutôt que remplie d'un zéro.
      */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginTop: 14,
          paddingTop: 14,
          borderTop: '1px solid #F1ECE3',
        }}
      >
        <Tuile libelle="Vues de fiches" comparaison={visites.vues_fiches} />
        <Tuile libelle="Demandes envoyées" comparaison={visites.demandes} />
      </div>
    </>
  );
}

function Tuile({ libelle, comparaison }: { libelle: string; comparaison: Comparaison }) {
  const pourcentage = ecart(comparaison);

  return (
    <div>
      <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
        {formaterNombre(comparaison.courant)}
        {pourcentage !== null && (
          <span
            style={{
              marginLeft: 8,
              fontSize: 11.5,
              fontWeight: 700,
              color: pourcentage >= 0 ? '#2E9E5B' : '#E63946',
            }}
          >
            {pourcentage >= 0 ? '▲' : '▼'} {Math.abs(pourcentage)} %
          </span>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: '#9AA3AF', marginTop: 2 }}>{libelle}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Top établissements
// ---------------------------------------------------------------------------

function TopEtablissements({ lignes, jours }: { lignes: Donnees['top_etablissements']; jours: number }) {
  if (lignes.length === 0) {
    return <Vide>Aucune fiche n&rsquo;a été consultée sur les {jours} derniers jours.</Vide>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {lignes.map((ligne, rang) => (
        <div
          key={ligne.id}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #F1ECE3' }}
        >
          <span style={{ fontSize: 13, fontWeight: 800, color: '#C9D2DE', flex: 'none' }}>{rang + 1}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontSize: 13.5,
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {ligne.nom}
            </span>
            <span style={{ display: 'block', fontSize: 12, color: '#9AA3AF', marginTop: 2 }}>
              {ligne.ville.nom} · {LIBELLE_TYPE[ligne.type]}
            </span>
          </span>
          {/*
            LE PROFIL PUBLIC N'EXISTE QUE POUR UNE FICHE VALIDÉE (RG03) : une
            fiche suspendue depuis ses vues répondrait 404. Le lien disparaît
            plutôt que de mener à une page introuvable.
          */}
          {ligne.statut === 'validee' && (
            <a
              href={`/etablissements/${ligne.slug}`}
              target="_blank"
              rel="noreferrer"
              title="Voir le profil public"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                border: '1px solid #C7D3E2',
                background: '#fff',
                color: '#1D3557',
                fontSize: 11.5,
                fontWeight: 600,
                padding: '5px 9px',
                borderRadius: 8,
                whiteSpace: 'nowrap',
                flex: 'none',
              }}
            >
              <Icon name="eye" size={12} color="#1D3557" />
              Profil
            </a>
          )}
          {/* Une note sans avis serait un zéro inventé : on ne l'affiche pas. */}
          {ligne.nb_avis > 0 && (
            <span style={{ fontSize: 12.5, color: '#E9A23B', fontWeight: 700, flex: 'none' }}>
              ★ {formaterNote(ligne.note_moy)}
            </span>
          )}
          <span style={{ fontSize: 13, fontWeight: 800, color: '#1D3557', flex: 'none', minWidth: 52, textAlign: 'right' }}>
            {formaterNombre(ligne.vues)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Habillage
// ---------------------------------------------------------------------------

function Carte({
  titre,
  droite,
  children,
}: {
  titre: string;
  droite?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 14, padding: '22px 24px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{titre}</h2>
        {droite}
      </div>
      {children}
    </section>
  );
}

function Vide({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#9AA3AF' }}>{children}</p>;
}
