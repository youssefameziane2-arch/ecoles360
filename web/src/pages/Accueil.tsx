import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { chargerArticleALaUne, chargerArticles, type CarteArticle } from '@/api/articles';
import { chargerAvisEnAvant } from '@/api/avis';
import { chargerFaq } from '@/api/faq';
import {
  chargerNiveauxFilieres,
  chargerVilles,
  FAMILLES_PAR_TYPE,
  LIBELLE_FAMILLE,
  LIBELLE_TYPE,
  rechercherEtablissements,
  type FiltresRecherche,
  type TypeEtablissement,
} from '@/api/etablissements';
import { AccordeonFaq } from '@/components/AccordeonFaq';
import { BandeauChiffres } from '@/components/BandeauChiffres';
import { HerosAccueil } from '@/components/HerosAccueil';
import { IconeWhatsApp, useConseillerAffiche } from '@/components/MobilierAssistance';
import { lienTelephone, lienWhatsApp } from '@/lib/telephone';
import { CarteBlog } from './Blog';
import { Button, CityCard, EstablishmentCard, Icon, SkeletonCard } from '@/ds/composants';
import { formaterDate, formaterMad, formaterNote } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

/**
 * Accueil — porté de la maquette « Site public écoles360 ».
 *
 * LA MAQUETTE EST LA SPÉCIFICATION. Les valeurs littérales de cette page
 * (largeur 1180, gouttière 32, filet #EAE6DE, h2 32/800/-0.8px, encadré rouge
 * majuscule au-dessus de chaque titre) en sont recopiées, et les cartes
 * viennent du design system livré — pas de copies maison.
 *
 * LA RECHERCHE SE FAIT EN DEUX TEMPS, comme dans la maquette : le type
 * d'établissement d'abord, la ville ensuite. Ce n'est pas une préférence
 * graphique — le type conditionne les filtres avancés (filières, langues), et
 * l'ordre l'explique au visiteur sans un mot.
 */

/** Icône du design system associée à chaque type (RG02). */
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
 * Notes minimales de la recherche avancée.
 *
 * DES ENTIERS SEULEMENT, là où la maquette propose « 4,5 et plus » : l'API
 * déclare `note_min` en `@IsInt()`, et 4.5 serait refusé en 422 — le parent
 * atterrirait sur une page d'erreur. Ce sont aussi les deux seuils des puces
 * « Note » des résultats, qui s'allument donc à l'arrivée. Écart consigné au
 * backlog (B-34).
 */
const OPTIONS_NOTE = [
  { valeur: '', libelle: 'Toutes les notes' },
  { valeur: '3', libelle: '3,0 et plus' },
  { valeur: '4', libelle: '4,0 et plus' },
];

/**
 * Tris de la recherche avancée — ceux que l'API sait faire.
 *
 * La maquette propose « Pertinence » et deux tris par prix : aucun n'existe
 * côté serveur, et un tri affiché qui ne trierait rien tromperait le visiteur.
 * Les libellés sont ceux du sélecteur des résultats, pour qu'il y retrouve son
 * choix. Écart consigné au backlog (B-34).
 */
const OPTIONS_TRI: { valeur: NonNullable<FiltresRecherche['tri']>; libelle: string }[] = [
  { valeur: 'note', libelle: 'Mieux notés' },
  { valeur: 'recent', libelle: 'Plus récents' },
  { valeur: 'nom', libelle: 'Ordre alphabétique' },
];

/** Tri appliqué par l'API en l'absence de paramètre — inutile de l'écrire dans l'URL. */
const TRI_PAR_DEFAUT = 'note';

export function Accueil() {
  useTitrePage(
    'écoles360',
    "Annuaire des établissements scolaires privés au Maroc : crèches, écoles, collèges, lycées et universités. Recherchez, comparez et contactez gratuitement.",
  );

  const naviguer = useNavigate();
  const [type, setType] = useState<TypeEtablissement | null>(null);
  const [ville, setVille] = useState('');
  const [villeOuverte, setVilleOuverte] = useState(false);
  const [messageType, setMessageType] = useState(false);

  const [avanceeOuverte, setAvanceeOuverte] = useState(false);
  const [noteMin, setNoteMin] = useState('');
  const [tri, setTri] = useState<string>(TRI_PAR_DEFAUT);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [caracteristiques, setCaracteristiques] = useState<string[]>([]);

  const villes = useQuery({ queryKey: ['villes'], queryFn: chargerVilles });
  const referentiel = useQuery({
    // Même clé et même durée que les résultats : le référentiel chargé ici
    // sert encore à l'arrivée sur la recherche, sans second aller-retour.
    queryKey: ['niveaux-filieres'],
    queryFn: chargerNiveauxFilieres,
    staleTime: 3_600_000,
    // Seulement à l'ouverture du panneau : la plupart des visiteurs de
    // l'accueil ne l'ouvrent pas, et n'ont pas à payer la requête.
    enabled: avanceeOuverte,
  });
  const aLaUne = useQuery({
    queryKey: ['etablissements', 'une'],
    queryFn: () => rechercherEtablissements({ per_page: 4 }),
  });

  // Le même conseiller que la bannière flottante, par construction : une seule
  // offre d'aide sur la page ne peut pas afficher deux numéros.
  const { conseiller, numero: numeroAide } = useConseillerAffiche();

  const faq = useQuery({ queryKey: ['faq'], queryFn: chargerFaq });
  const avisEnAvant = useQuery({ queryKey: ['avis', 'en-avant'], queryFn: chargerAvisEnAvant });
  const blog = useQuery({
    queryKey: ['articles', 'accueil'],
    queryFn: () => chargerArticles(),
  });
  // Même clé que le bandeau de la page Blog : l'un réchauffe le cache de l'autre.
  const articleUne = useQuery({ queryKey: ['articles', 'une'], queryFn: chargerArticleALaUne });

  // Le carrousel de témoignages puise dans les MÊMES avis mis en avant que la
  // grille plus bas : l'administrateur n'a qu'une sélection à tenir, et les
  // deux blocs ne peuvent pas se contredire.
  const temoignages = avisEnAvant.data ?? [];
  const [temoin, setTemoin] = useState(0);
  const temoin_actuel = temoignages[temoin % Math.max(1, temoignages.length)];

  /**
   * Trois articles sur l'accueil, À LA UNE D'ABORD — comme la maquette.
   *
   * `GET /articles` EXCLUT l'article à la une, à raison : la page Blog le montre
   * déjà dans son bandeau de tête. L'accueil n'a pas de bandeau ; sans cette
   * seconde requête, l'article que l'administrateur pousse serait le seul à ne
   * jamais y paraître.
   *
   * Le dédoublonnage ne sert que si la règle serveur change un jour : l'article
   * apparaîtrait alors deux fois dans trois cartes.
   *
   * On attend LES DEUX réponses avant d'afficher : sinon la liste arrive, puis
   * l'article à la une s'insère en tête et décale les cartes sous les yeux du
   * visiteur. Un échec de l'article à la une n'empêche rien — on retombe sur la
   * liste seule, comme avant.
   */
  const une = articleUne.data ?? null;
  const blogPret = !blog.isPending && !articleUne.isPending;
  const apercuBlog: CarteArticle[] = blogPret
    ? [...(une ? [une] : []), ...(blog.data?.data ?? []).filter((a) => a.id !== une?.id)].slice(0, 3)
    : [];

  // Les rubriques sont aplaties : l'accueil montre les quatre premières
  // questions de la FAQ, toutes rubriques confondues, comme la maquette.
  const apercuFaq = (faq.data ?? []).flatMap((rubrique) => rubrique.items).slice(0, 4);

  // Les familles de filtres suivent le type choisi, comme dans la maquette :
  // sans type, le panneau invite à en choisir un plutôt que d'afficher des
  // filières d'ingénierie à qui cherche une crèche.
  const famillesAvancees = type ? FAMILLES_PAR_TYPE[type] : [];
  const groupesAvances = famillesAvancees
    .map((famille) => ({
      famille,
      options: (referentiel.data ?? []).filter((c) => c.categorie === famille),
    }))
    .filter((groupe) => groupe.options.length > 0);

  const basculerCaracteristique = (id: string) =>
    setCaracteristiques((actuelles) =>
      actuelles.includes(id) ? actuelles.filter((c) => c !== id) : [...actuelles, id],
    );

  /** Ne garde que les chiffres : `budget_min` est un entier côté API, « 12 000 » y serait refusé. */
  const chiffresSeuls = (saisie: string) => saisie.replace(/[^0-9]/g, '');

  const suggestions = (villes.data ?? []).filter((v) =>
    v.nom.toLowerCase().includes(ville.trim().toLowerCase()),
  );

  const rechercher = () => {
    // Le type est obligatoire dans la maquette : on le rappelle sur place
    // plutôt que de lancer une recherche que le visiteur n'a pas cadrée.
    if (!type) {
      setMessageType(true);
      // Comme la maquette : le panneau s'ouvre sur son invite « Choisissez
      // d'abord un type… », qui redit la consigne là où le regard descend.
      setAvanceeOuverte(true);
      return;
    }

    const params = new URLSearchParams({ type });
    const correspondance = villes.data?.find(
      (v) => v.nom.toLowerCase() === ville.trim().toLowerCase(),
    );

    if (correspondance) params.set('ville', correspondance.slug);
    else if (ville.trim()) params.set('q', ville.trim());

    // Les noms sont ceux que lisent les résultats et l'API : la recherche
    // avancée n'a pas d'état propre, elle pré-remplit l'URL partageable.
    if (noteMin) params.set('note_min', noteMin);
    if (tri !== TRI_PAR_DEFAUT) params.set('tri', tri);
    if (budgetMin) params.set('budget_min', budgetMin);
    if (budgetMax) params.set('budget_max', budgetMax);

    // Seules partent les caractéristiques des familles du type COURANT. Une
    // filière cochée pour « Lycée » avant de passer à « Crèche » filtrerait
    // sinon en silence sur un critère que le panneau ne montre plus.
    const retenues = caracteristiques.filter((id) =>
      groupesAvances.some((groupe) => groupe.options.some((option) => option.id === id)),
    );
    if (retenues.length > 0) params.set('niveaux', retenues.join(','));

    naviguer(`/etablissements?${params.toString()}`);
  };

  return (
    <>
      {/* ---- Héros ------------------------------------------------------ */}
      <HerosAccueil />

      {/* ---- Carte de recherche, en surplomb du héros -------------------- */}
      <section style={{ position: 'relative', zIndex: 5, maxWidth: 1080, margin: '-72px auto 0', padding: '0 32px' }}>
        <div
          style={{
            background: '#fff',
            border: '1px solid #EAE6DE',
            borderRadius: 20,
            boxShadow: '0 18px 50px rgba(26,26,26,.12)',
            padding: '20px 26px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px', color: '#1A1A1A' }}>
              1. Quel type d&rsquo;établissement cherchez-vous&nbsp;?
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--e360-red)', fontWeight: 600 }}>Obligatoire</span>
          </div>

          <div className="e3-typegrid">
            {TYPES.map((t) => {
              const actif = type === t;

              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    setMessageType(false);
                  }}
                  aria-pressed={actif}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 13,
                    minHeight: 124,
                    padding: '22px 12px',
                    background: actif ? 'var(--e360-red-tint)' : '#fff',
                    border: `1.5px solid ${actif ? 'var(--e360-red)' : '#EAE6DE'}`,
                    borderRadius: 16,
                    transition: 'border-color .15s ease, background .15s ease',
                    font: 'inherit',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: actif ? '#fff' : '#FBE9EA',
                    }}
                  >
                    <Icon name={ICONE_TYPE[t]} size={26} color="var(--e360-red)" />
                  </span>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      letterSpacing: '-0.2px',
                      color: actif ? 'var(--e360-red-700)' : '#1A1A1A',
                      textAlign: 'center',
                    }}
                  >
                    {LIBELLE_TYPE[t]}
                  </span>
                </button>
              );
            })}
          </div>

          {messageType && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 14,
                color: 'var(--e360-red)',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <Icon name="alert-circle" size={17} />
              Veuillez d&rsquo;abord choisir un type d&rsquo;établissement.
            </div>
          )}

          <div className="e3-searchrow" style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <label
                htmlFor="recherche-ville"
                style={{ display: 'block', fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px', color: '#1A1A1A', marginBottom: 10 }}
              >
                2. Ville ou quartier
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  border: `1.5px solid ${villeOuverte ? 'var(--e360-navy)' : '#EAE6DE'}`,
                  background: '#fff',
                  borderRadius: 12,
                  padding: '0 14px',
                }}
              >
                <Icon name="map-pin" size={18} color="var(--e360-grey-2)" />
                <input
                  id="recherche-ville"
                  value={ville}
                  onChange={(evenement) => {
                    setVille(evenement.target.value);
                    setVilleOuverte(true);
                  }}
                  onFocus={() => setVilleOuverte(true)}
                  // Fermeture différée : un clic sur une suggestion déclenche
                  // d'abord le blur, et fermer tout de suite l'annulerait.
                  onBlur={() => setTimeout(() => setVilleOuverte(false), 150)}
                  onKeyDown={(evenement) => evenement.key === 'Enter' && rechercher()}
                  placeholder="Écrivez une ville ou un quartier…"
                  autoComplete="off"
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    font: 'inherit',
                    fontSize: 15,
                    padding: '14px 0',
                    color: '#1A1A1A',
                    outline: 'none',
                  }}
                />
                {ville && (
                  <button
                    type="button"
                    onClick={() => setVille('')}
                    aria-label="Effacer la ville"
                    style={{
                      cursor: 'pointer',
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--e360-grey-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="x" size={15} />
                  </button>
                )}
              </div>

              {villeOuverte && ville.trim() !== '' && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '100%',
                    marginTop: 6,
                    zIndex: 40,
                    background: '#fff',
                    border: '1px solid #EAE6DE',
                    borderRadius: 12,
                    boxShadow: '0 14px 40px rgba(26,26,26,.16)',
                    overflow: 'hidden',
                    maxHeight: 288,
                    overflowY: 'auto',
                  }}
                >
                  {suggestions.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onMouseDown={() => {
                        setVille(v.nom);
                        setVilleOuverte(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 11,
                        padding: '11px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #F1ECE3',
                        border: 'none',
                        borderWidth: '0 0 1px',
                        background: 'transparent',
                        width: '100%',
                        textAlign: 'left',
                        font: 'inherit',
                      }}
                    >
                      <span
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 9,
                          background: 'var(--e360-navy-tint)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flex: 'none',
                        }}
                      >
                        <Icon name="map-pin" size={15} color="var(--e360-navy)" />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: '#1A1A1A' }}>
                          {v.nom}
                        </span>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--e360-grey-2)' }}>
                          {v.region ?? 'Maroc'}
                        </span>
                      </span>
                    </button>
                  ))}

                  {suggestions.length === 0 && (
                    <div style={{ padding: 14, fontSize: 13.5, color: 'var(--e360-grey-2)', textAlign: 'center' }}>
                      Aucune ville ne correspond.
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button variant="primary" size="lg" onClick={rechercher}>
              Rechercher
            </Button>
          </div>

          {/*
            RECHERCHE AVANCÉE. Le `FilterBar` du design system n'y convient pas :
            c'est une rangée de déclencheurs à menu avec un bouton « Appliquer »,
            là où la maquette dessine des sélecteurs et des rangées de puces
            libellées, appliqués d'un seul « Rechercher ».

            PAS DE BASCULE « École sponsorisée », pourtant dessinée : aucun
            paramètre de l'API ne filtre dessus (même écart que les résultats),
            et un interrupteur sans effet mentirait au visiteur. Consigné au
            backlog (B-34).
          */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: 14,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => setAvanceeOuverte((ouverte) => !ouverte)}
              aria-expanded={avanceeOuverte}
              aria-controls="recherche-avancee"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                background: 'transparent',
                color: '#1D3557',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1D3557" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              Recherche avancée
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1D3557"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                style={{ transform: `rotate(${avanceeOuverte ? 180 : 0}deg)`, transition: 'transform .2s ease' }}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <span style={{ fontSize: 12.5, color: '#9AA3AF' }}>
              Affinez par langues, activités, filière, budget…
            </span>
          </div>

          {avanceeOuverte && (
            <div
              id="recherche-avancee"
              style={{
                marginTop: 12,
                padding: 18,
                background: '#FBFAF7',
                border: '1px solid #EAE6DE',
                borderRadius: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
                <select
                  value={noteMin}
                  onChange={(evenement) => setNoteMin(evenement.target.value)}
                  aria-label="Note minimale"
                  style={selecteurAvance}
                >
                  {OPTIONS_NOTE.map((option) => (
                    <option key={option.valeur} value={option.valeur}>
                      {option.libelle}
                    </option>
                  ))}
                </select>

                <select
                  value={tri}
                  onChange={(evenement) => setTri(evenement.target.value)}
                  aria-label="Ordre des résultats"
                  style={selecteurAvance}
                >
                  {OPTIONS_TRI.map((option) => (
                    <option key={option.valeur} value={option.valeur}>
                      Trier : {option.libelle}
                    </option>
                  ))}
                </select>

                {/*
                  MAD/AN, là où la maquette écrit « MAD/mois » : l'API filtre sur
                  le budget ANNUEL des fiches. Un montant mensuel saisi ici
                  écarterait à tort presque toutes les écoles. Les champs sont
                  élargis d'autant — un budget annuel compte six chiffres — et
                  plafonnés à sept : au-delà, l'entier sort de ce que la base
                  sait comparer, et la recherche échouerait.
                */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#fff',
                    border: '1px solid #E1E5EA',
                    borderRadius: 11,
                    padding: '5px 12px',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: '#9AA3AF' }}>
                    Budget
                  </span>
                  <input
                    value={budgetMin}
                    onChange={(evenement) => setBudgetMin(chiffresSeuls(evenement.target.value))}
                    onKeyDown={(evenement) => evenement.key === 'Enter' && rechercher()}
                    inputMode="numeric"
                    maxLength={7}
                    placeholder="Min"
                    aria-label="Budget annuel minimum, en dirhams"
                    style={champBudgetAvance}
                  />
                  <span style={{ color: '#9AA3AF' }}>–</span>
                  <input
                    value={budgetMax}
                    onChange={(evenement) => setBudgetMax(chiffresSeuls(evenement.target.value))}
                    onKeyDown={(evenement) => evenement.key === 'Enter' && rechercher()}
                    inputMode="numeric"
                    maxLength={7}
                    placeholder="Max"
                    aria-label="Budget annuel maximum, en dirhams"
                    style={champBudgetAvance}
                  />
                  <span style={{ fontSize: 12, color: '#9AA3AF', fontWeight: 600, whiteSpace: 'nowrap' }}>MAD/an</span>
                </div>
              </div>

              {!type && (
                <div style={{ fontSize: 13, color: '#9AA3AF', paddingTop: 6 }}>
                  Choisissez d&rsquo;abord un type d&rsquo;établissement ci-dessus pour affiner par
                  langues, activités, filière…
                </div>
              )}

              {type && referentiel.isPending && (
                <div style={{ fontSize: 13, color: '#9AA3AF', paddingTop: 6 }}>Chargement des filtres…</div>
              )}

              {type && referentiel.isError && (
                <div role="alert" style={{ fontSize: 13, color: 'var(--e360-red)', paddingTop: 6 }}>
                  Les filtres par langue, activité ou filière n&rsquo;ont pas pu être chargés. Les
                  autres critères restent utilisables.
                </div>
              )}

              {groupesAvances.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    paddingTop: 12,
                    borderTop: '1px solid #EFECE6',
                  }}
                >
                  {groupesAvances.map(({ famille, options }) => (
                    <div
                      key={famille}
                      role="group"
                      aria-label={LIBELLE_FAMILLE[famille]}
                      style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}
                    >
                      <span
                        style={{
                          flex: 'none',
                          minWidth: 82,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '.6px',
                          textTransform: 'uppercase',
                          color: '#9AA3AF',
                        }}
                      >
                        {LIBELLE_FAMILLE[famille]}
                      </span>
                      {options.map((option) => (
                        <PuceFiltre
                          key={option.id}
                          actif={caracteristiques.includes(option.id)}
                          onClick={() => basculerCaracteristique(option.id)}
                        >
                          {option.libelle}
                        </PuceFiltre>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ---- Bandeau de confiance --------------------------------------- */}
      <section style={{ maxWidth: 1180, margin: '64px auto 0', padding: '0 32px' }}>
        <BandeauChiffres />
      </section>

      {/* ---- Établissements à la une ------------------------------------ */}
      <section style={{ maxWidth: 1180, margin: '72px auto 0', padding: '0 32px' }}>
        <EnTeteSection
          surtitre="Notre sélection"
          titre="Établissements à la une"
          lien="Tout voir"
          onLien={() => naviguer('/etablissements')}
        />

        <div className="e3-featgrid">
          {aLaUne.isPending && [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}

          {aLaUne.data?.data.map((fiche) => (
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

        {aLaUne.isError && (
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--e360-red)' }}>
            Les établissements n&rsquo;ont pas pu être chargés. Rechargez la page.
          </p>
        )}
      </section>

      {/* ---- Ce que nous faisons ---------------------------------------- */}
      <section style={{ maxWidth: 1180, margin: '80px auto 0', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={surtitreStyle}>Ce que nous faisons</div>
          <h2 style={titreSectionStyle}>Choisir une école, enfin simple</h2>
        </div>

        <div className="e3-trigrid">
          <CarteArgument
            icone="search"
            titre="Tout au même endroit"
            texte="Crèches, écoles, collèges, lycées, universités et centres de formation privés du Maroc, réunis dans un seul annuaire."
          />
          <CarteArgument
            icone="star"
            titre="Des avis relus"
            texte="Chaque avis est relu avant publication, et l'établissement peut répondre. Ni faux éloges, ni règlements de comptes."
          />
          <CarteArgument
            icone="message-circle"
            titre="Un contact direct"
            texte="Une demande, et l'établissement vous rappelle. Gratuit, sans compte à créer, sans intermédiaire."
          />
        </div>
      </section>

      {/* ---- Par ville --------------------------------------------------- */}
      <section style={{ maxWidth: 1180, margin: '80px auto 0', padding: '0 32px' }}>
        <EnTeteSection
          surtitre="Explorez"
          titre="Les établissements par ville"
          lien="Toutes les villes"
          onLien={() => naviguer('/etablissements')}
        />

        {/*
          SEULES LES VILLES QUI ONT DES FICHES sont affichées. Douze vignettes
          dont neuf annoncent « 0 établissements » donnent l'impression d'un
          annuaire vide alors qu'il est jeune. Elles réapparaîtront d'elles-mêmes
          à mesure que les fiches arrivent.

          Le libellé « 1 établissements » vient de `CityCard` du design system,
          qui accole «  établissements » au nombre sans gérer le singulier. Ce
          n'est pas corrigeable d'ici sans renoncer au composant livré — signalé
          au backlog (B-31).
        */}
        <div className="e3-citygrid">
          {villes.data?.filter((v) => v.nb_etablissements > 0).map((v) => (
            <CityCard
              key={v.id}
              city={v.nom}
              count={v.nb_etablissements}
              height={200}
              onClick={() => naviguer(`/villes/${v.slug}`)}
            />
          ))}
        </div>
      </section>

      {/* ---- Témoignages — carrousel ------------------------------------- */}
      {/*
        UN SEUL TÉMOIGNAGE À LA FOIS, avec flèches et points : c'est ce que fait
        la maquette. Une grille de trois dirait la même chose en plus petit ;
        le carrousel donne au témoignage la place d'être lu.
      */}
      {temoignages.length > 0 && (
        <section
          style={{
            background: '#fff',
            borderTop: '1px solid #EAE6DE',
            borderBottom: '1px solid #EAE6DE',
            marginTop: 80,
            padding: '72px 0',
          }}
        >
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={surtitreStyle}>Témoignages</div>
              <h2 style={titreSectionStyle}>Ils nous font confiance</h2>
            </div>

            <div className="e3-reviewrow" style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 20 }}>
              <FlecheCarrousel
                sens="precedent"
                onClick={() => setTemoin((t) => (t - 1 + temoignages.length) % temoignages.length)}
              />

              <div
                style={{
                  flex: 1,
                  background: '#FBFAF7',
                  border: '1px solid #EAE6DE',
                  borderRadius: 18,
                  padding: '40px 44px',
                  textAlign: 'center',
                  minHeight: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div style={{ color: '#E9A23B', fontSize: 18, letterSpacing: 3, marginBottom: 18 }}>
                  {'★'.repeat(temoin_actuel?.note ?? 5)}
                </div>
                <p
                  style={{
                    margin: 0,
                    font: "500 20px/1.55 'Inter', sans-serif",
                    color: '#1A1A1A',
                    letterSpacing: '-0.2px',
                  }}
                >
                  « {temoin_actuel?.commentaire} »
                </p>
                <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: '#1D3557',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      font: "700 15px/1 'Inter', sans-serif",
                    }}
                  >
                    {initialesDe(temoin_actuel?.auteur_nom ?? '')}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ font: "700 14.5px/1.3 'Inter', sans-serif" }}>
                      {temoin_actuel?.auteur_nom}
                    </div>
                    <div style={{ font: "400 13px/1.3 'Inter', sans-serif", color: '#9AA3AF' }}>
                      Parent · {temoin_actuel?.etablissement.nom}
                    </div>
                  </div>
                </div>
              </div>

              <FlecheCarrousel
                sens="suivant"
                onClick={() => setTemoin((t) => (t + 1) % temoignages.length)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              {temoignages.map((avis, rang) => (
                <button
                  key={avis.id}
                  type="button"
                  aria-label={`Témoignage ${rang + 1}`}
                  onClick={() => setTemoin(rang)}
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                    padding: 0,
                    width: rang === temoin ? 28 : 8,
                    height: 8,
                    borderRadius: 8,
                    background: rang === temoin ? '#E63946' : '#E1E5EA',
                    transition: 'all .3s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---- Comment ça marche ------------------------------------------- */}
      <section style={{ maxWidth: 1180, margin: '80px auto 0', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={surtitreStyle}>Simple et rapide</div>
          <h2 style={titreSectionStyle}>Comment ça marche</h2>
        </div>

        <div className="e3-trigrid">
          <Etape n={1} titre="Cherchez" texte="Choisissez un type d'établissement, puis une ville. Affinez par note, budget ou filière." />
          <Etape n={2} titre="Comparez" texte="Consultez les fiches : niveaux, équipements, tarifs indicatifs et avis des parents." />
          <Etape n={3} titre="Contactez" texte="Envoyez une demande ou appelez directement. L'établissement vous recontacte." />
        </div>
      </section>

      {/* ---- Ce que disent les parents ----------------------------------- */}
      {/*
        SÉLECTION ÉDITORIALE, PAS ALGORITHMIQUE (RG27) : ce sont les avis que
        l'administrateur a épinglés depuis l'écran de modération. Prendre « les
        trois meilleures notes » afficherait trois fois cinq étoiles, ce
        qu'aucun parent ne croit.
      */}
      {avisEnAvant.data && avisEnAvant.data.length > 0 && (
        <section style={{ maxWidth: 1180, margin: '80px auto 0', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={surtitreStyle}>Ils nous font confiance</div>
            <h2 style={titreSectionStyle}>Ce que disent les parents</h2>
          </div>

          <div className="e3-blog-grille">
            {avisEnAvant.data.map((avis) => (
              <div
                key={avis.id}
                style={{
                  background: '#fff',
                  border: '1px solid #EAE6DE',
                  borderRadius: 16,
                  padding: 26,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ fontSize: 15, letterSpacing: 2 }}>
                  <span style={{ color: '#E9A23B' }}>{'★'.repeat(avis.note)}</span>
                  <span style={{ color: '#D9DEE5' }}>{'★'.repeat(5 - avis.note)}</span>
                </div>
                <p style={{ margin: 0, font: "400 15px/1.65 'Inter', sans-serif", color: '#1A1A1A', flex: 1 }}>
                  « {avis.commentaire} »
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderTop: '1px solid #F1ECE3',
                    paddingTop: 14,
                  }}
                >
                  <span
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: '#1D3557',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      font: "700 15px/1 'Inter', sans-serif",
                      flex: 'none',
                    }}
                  >
                    {initialesDe(avis.auteur_nom)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: "700 14px/1.3 'Inter', sans-serif" }}>{avis.auteur_nom}</div>
                    <div
                      style={{
                        font: "400 12.5px/1.3 'Inter', sans-serif",
                        color: '#9AA3AF',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {avis.etablissement.nom} · {formaterDate(avis.depose_le)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Le blog ------------------------------------------------------ */}
      {apercuBlog.length > 0 && (
        <section style={{ maxWidth: 1180, margin: '80px auto 0', padding: '0 32px' }}>
          <EnTeteSection
            surtitre="Le blog"
            titre="Conseils pour les parents"
            lien="Tous les articles"
            onLien={() => naviguer('/blog')}
          />

          <div className="e3-blog-grille">
            {apercuBlog.map((article) => (
              <CarteBlog key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* ---- Emplacement annonceur --------------------------------------- */}
      {/*
        LA MAQUETTE RÉSERVE UN BANDEAU 970 × 90 pour la publicité. Aucune régie
        n'est branchée : l'emplacement est donc dessiné à vide, avec sa mention
        « Publicité » — c'est ce que montre la maquette, et c'est honnête. Un
        faux visuel d'annonceur laisserait croire à un partenariat qui n'existe
        pas.
      */}
      <section style={{ maxWidth: 1180, margin: '76px auto 0', padding: '0 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              font: "700 10px/1 'Inter', sans-serif",
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              color: '#B0A990',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B0A990" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 11l19-9-9 19-2-8-8-2Z" />
            </svg>
            Publicité
          </span>
          <div
            style={{
              width: '100%',
              maxWidth: 970,
              height: 90,
              border: '1px dashed #D4D0C7',
              borderRadius: 12,
              background: '#F4F1EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              color: '#A6A090',
              font: "600 13.5px/1 'Inter', sans-serif",
              letterSpacing: '.2px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B7B09E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 15 5-4 4 3 3-2 6 5" />
              <circle cx="8.5" cy="9.5" r="1.5" />
            </svg>
            Emplacement annonceur — 970 × 90
          </div>
        </div>
      </section>

      {/* ---- Questions fréquentes ---------------------------------------- */}
      {/*
        QUATRE QUESTIONS, PAS TOUTE LA FAQ — c'est ce que montre la maquette.
        Ce sont les quatre premières de la liste que l'administrateur range :
        l'ordre qu'il donne à la FAQ décide donc aussi de ce qui s'affiche ici,
        sans second réglage à tenir.
      */}
      {apercuFaq.length > 0 && (
        <section style={{ maxWidth: 880, margin: '80px auto 0', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={surtitreStyle}>Questions fréquentes</div>
            <h2 style={titreSectionStyle}>Vous vous demandez peut-être…</h2>
          </div>

          <AccordeonFaq items={apercuFaq} ouvertParDefaut={apercuFaq[0]?.id} />
        </section>
      )}

      {/*
        ---- Besoin d'aide pour choisir ? ---------------------------------

        LA SECTION DISPARAÎT SANS CONSEILLER JOIGNABLE. Ses deux boutons
        — appeler, écrire — mènent tous deux à une personne ; elle n'a aucun
        contenu propre à montrer. La laisser sans ligne derrière, c'est
        promettre une aide qui ne répondra pas, et le promettre sur la page la
        plus vue du site.
      */}
      {numeroAide && (
      <section style={{ maxWidth: 1180, margin: '80px auto 0', padding: '0 32px' }}>
        <div
          style={{
            background: '#FBFAF7',
            border: '1px solid #EAE6DE',
            borderRadius: 20,
            padding: '40px 48px',
            display: 'flex',
            alignItems: 'center',
            gap: 32,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 280 }}>
            <h2 style={{ margin: 0, font: "800 26px/1.2 'Inter', sans-serif", letterSpacing: '-0.5px' }}>
              Besoin d&rsquo;aide pour choisir&nbsp;?
            </h2>
            <p
              style={{
                margin: '10px 0 0',
                font: "400 16px/1.55 'Inter', sans-serif",
                color: '#5A6472',
                maxWidth: 520,
              }}
            >
              Notre équipe vous accompagne gratuitement pour trouver
              l&rsquo;établissement idéal pour votre enfant.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/*
              PAS DE BOUTON SANS CONSEILLER RÉEL. La bannière flottante peut se
              permettre un repli le temps d'un chargement ; ce bloc, en pleine
              page, afficherait un numéro factice comme s'il était le bon. Mieux
              vaut un bouton de moins qu'un appel vers personne.
            */}
            {conseiller && (
              <a
                href={lienTelephone(conseiller.telephone)}
                aria-label={`Appeler ${conseiller.nom}, conseiller écoles360, au ${conseiller.telephone}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  background: '#1D3557',
                  color: '#fff',
                  font: "600 15px/1 'Inter', sans-serif",
                  padding: '14px 24px',
                  borderRadius: 11,
                }}
              >
                <Icon name="phone" size={17} color="#fff" />
                {conseiller.telephone}
              </a>
            )}
            {/* Même numéro que le bouton WhatsApp flottant, dans tous les cas. */}
            <a
              href={lienWhatsApp(numeroAide)}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                background: '#2E9E5B',
                color: '#fff',
                font: "600 15px/1 'Inter', sans-serif",
                padding: '14px 24px',
                borderRadius: 11,
                boxShadow: '0 6px 16px rgba(46,158,91,.22)',
              }}
            >
              <IconeWhatsApp />
              Nous écrire
            </a>
          </div>
        </div>
      </section>
      )}

      {/* ---- Vous dirigez un établissement ? ----------------------------- */}
      <section style={{ maxWidth: 1180, margin: '80px auto 90px', padding: '0 32px' }}>
        <div
          className="e3-ctapanel"
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: '#1D3557',
            borderRadius: 22,
            padding: '56px 60px',
            display: 'flex',
            alignItems: 'center',
            gap: 40,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -40,
              top: -40,
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'rgba(230,57,70,.14)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 120,
              bottom: -80,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.05)',
            }}
          />

          <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
            <h2
              style={{
                margin: 0,
                color: '#fff',
                font: "800 30px/1.2 'Inter', sans-serif",
                letterSpacing: '-0.6px',
              }}
            >
              Vous dirigez un établissement&nbsp;?
            </h2>
            <p
              style={{
                margin: '14px 0 0',
                color: '#AFC0D6',
                font: "400 17px/1.55 'Inter', sans-serif",
                maxWidth: 520,
              }}
            >
              Référencez votre école, gagnez en visibilité et recevez des contacts de parents
              qualifiés près de chez vous.
            </p>
          </div>

          <Link
            to="/inscription-etablissement"
            style={{
              position: 'relative',
              flex: 'none',
              background: '#E63946',
              color: '#fff',
              font: "600 16px/1 'Inter', sans-serif",
              padding: '16px 30px',
              borderRadius: 12,
              boxShadow: '0 10px 24px rgba(230,57,70,.3)',
            }}
          >
            Inscrire mon établissement
          </Link>
        </div>
      </section>
    </>
  );
}

/** Flèche ronde du carrousel de témoignages — 46 px, filet sable. */
function FlecheCarrousel({ sens, onClick }: { sens: 'precedent' | 'suivant'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={sens === 'precedent' ? 'Témoignage précédent' : 'Témoignage suivant'}
      style={{
        flex: 'none',
        width: 46,
        height: 46,
        borderRadius: '50%',
        border: '1px solid #EAE6DE',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#5A6472',
        padding: 0,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={sens === 'precedent' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} />
      </svg>
    </button>
  );
}

/** Initiales d'un nom, pour la pastille d'avatar — « Karima B. » → « KB ». */
function initialesDe(nom: string): string {
  return nom
    .split(/\s+/)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? '')
    .join('');
}

/** En-tête de section de la maquette : surtitre rouge, titre, lien fléché. */
function EnTeteSection({
  surtitre,
  titre,
  lien,
  onLien,
}: {
  surtitre: string;
  titre: string;
  lien?: string;
  onLien?: () => void;
}) {
  return (
    <div
      className="e3-sechead"
      style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}
    >
      <div>
        <div style={surtitreStyle}>{surtitre}</div>
        <h2 style={titreSectionStyle}>{titre}</h2>
      </div>
      {lien && (
        <button
          type="button"
          onClick={onLien}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--e360-navy)',
            background: 'transparent',
            border: 'none',
            font: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          {lien} <span aria-hidden>→</span>
        </button>
      )}
    </div>
  );
}

function CarteArgument({ icone, titre, texte }: { icone: string; titre: string; texte: string }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderRadius: 18,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Emplacement visuel de la maquette : gris de placeholder du DS tant que
          les photos de la direction artistique ne sont pas livrées. */}
      <div style={{ height: 172, background: 'var(--surface-image)' }} aria-hidden />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 13,
            background: '#FBE9EA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icone} size={24} color="var(--e360-red)" />
        </div>
        <h3 style={{ margin: '2px 0 0', fontSize: 18.5, fontWeight: 700, letterSpacing: '-0.3px' }}>{titre}</h3>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: 'var(--e360-grey)' }}>{texte}</p>
      </div>
    </div>
  );
}

function Etape({ n, titre, texte }: { n: number; titre: string; texte: string }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '18px 20px', borderRadius: 14, background: '#fff', border: '1px solid #EAE6DE' }}>
      <span
        style={{
          flex: 'none',
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'var(--e360-red-tint)',
          color: 'var(--e360-red-700)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        {n}
      </span>
      <div style={{ minWidth: 0 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 17.5, fontWeight: 700, letterSpacing: '-0.3px' }}>{titre}</h3>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--e360-grey)' }}>{texte}</p>
      </div>
    </div>
  );
}

/**
 * Puce de caractéristique de la recherche avancée.
 *
 * Pas la `Puce` des résultats : la maquette de l'accueil l'habille autrement
 * (filet #E1E5EA, texte rouge vif une fois cochée), et la page des résultats
 * n'a pas à changer d'allure pour autant.
 */
function PuceFiltre({
  children,
  actif,
  onClick,
}: {
  children: React.ReactNode;
  actif: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      style={{
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        padding: '6px 13px',
        borderRadius: 20,
        background: actif ? '#FDE8EA' : '#fff',
        border: `1px solid ${actif ? '#E63946' : '#E1E5EA'}`,
        color: actif ? '#E63946' : '#5A6472',
        transition: 'all .15s ease',
      }}
    >
      {children}
    </button>
  );
}

const selecteurAvance: React.CSSProperties = {
  border: '1px solid #E1E5EA',
  background: '#fff',
  borderRadius: 11,
  fontFamily: 'inherit',
  fontSize: 14,
  fontWeight: 500,
  padding: '10px 14px',
  cursor: 'pointer',
  color: '#1A1A1A',
};

const champBudgetAvance: React.CSSProperties = {
  width: 76,
  background: '#fff',
  border: '1px solid #E1E5EA',
  borderRadius: 8,
  fontFamily: 'inherit',
  fontSize: 13.5,
  padding: '7px 9px',
  color: '#1A1A1A',
};

const surtitreStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: 'var(--e360-red)',
  marginBottom: 10,
};

const titreSectionStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 32,
  fontWeight: 800,
  letterSpacing: '-0.8px',
};
