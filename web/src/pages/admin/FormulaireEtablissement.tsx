import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  chargerReferentielEtablissements,
  creerEtablissement,
  LIBELLE_CATEGORIE,
  type CategorieCaracteristique,
  type NouvelEtablissement,
} from '@/api/admin';
import { LIBELLE_TYPE, type TypeEtablissement } from '@/api/etablissements';
import { AlerteErreur, Champ, ZoneTexte } from '@/components/Champs';
import { Button, Icon } from '@/ds/composants';

const TYPES = Object.keys(LIBELLE_TYPE) as TypeEtablissement[];

/** Ordre d'affichage des familles — du plus structurant au plus accessoire. */
const ORDRE_CATEGORIES: CategorieCaracteristique[] = [
  'niveau',
  'filiere',
  'langue',
  'cursus',
  'domaine',
  'format',
  'matiere',
  'activite',
];

/** État du formulaire : tout en chaînes, converti à l'envoi. */
interface Saisie {
  nom: string;
  ville_id: string;
  type: TypeEtablissement | '';
  groupe: string;
  adresse: string;
  quartier: string;
  lat: string;
  lng: string;
  tel: string;
  whatsapp: string;
  email: string;
  site_web: string;
  langues: string;
  budget_min: string;
  budget_max: string;
  description: string;
}

const VIERGE: Saisie = {
  nom: '',
  ville_id: '',
  type: '',
  groupe: '',
  adresse: '',
  quartier: '',
  lat: '',
  lng: '',
  tel: '',
  whatsapp: '',
  email: '',
  site_web: '',
  langues: '',
  budget_min: '',
  budget_max: '',
  description: '',
};

/**
 * Ajouter un établissement — back-office admin.
 *
 * TROIS CHAMPS OBLIGATOIRES, LE RESTE PLIÉ. C'est le cas d'usage réel : le
 * commercial rentre d'un rendez-vous avec un nom, une ville et un type, et
 * saisit le reste quand l'école lui aura envoyé ses éléments. Un formulaire
 * qui exige tout d'un coup se remplit de valeurs inventées.
 *
 * LES ERREURS DE CHAMP VIENNENT DE L'API. `ApiError.champs` porte le détail
 * renvoyé par le `ValidationPipe` ; les rejouer ici en JavaScript ferait deux
 * vérités qui divergeraient — celle qui s'affiche et celle qui décide.
 */
export function FormulaireEtablissement({
  onCree,
  onAnnuler,
}: {
  onCree: (fiche: { id: string; nom: string; slug: string }) => void;
  onAnnuler: () => void;
}) {
  const [saisie, setSaisie] = useState<Saisie>(VIERGE);
  const [cochees, setCochees] = useState<Set<string>>(new Set());
  const [detaillee, setDetaillee] = useState(false);

  const referentiel = useQuery({
    queryKey: ['admin', 'etablissements', 'referentiel'],
    queryFn: chargerReferentielEtablissements,
    // Villes et caractéristiques ne bougent qu'à la migration : les recharger
    // à chaque ouverture du formulaire n'apporterait rien.
    staleTime: 15 * 60 * 1000,
  });

  const parCategorie = useMemo(() => {
    const groupes = new Map<CategorieCaracteristique, { id: string; libelle: string }[]>();

    for (const caracteristique of referentiel.data?.caracteristiques ?? []) {
      const liste = groupes.get(caracteristique.categorie) ?? [];
      liste.push({ id: caracteristique.id, libelle: caracteristique.libelle });
      groupes.set(caracteristique.categorie, liste);
    }

    return ORDRE_CATEGORIES.filter((categorie) => groupes.has(categorie)).map((categorie) => ({
      categorie,
      valeurs: groupes.get(categorie)!,
    }));
  }, [referentiel.data]);

  const creation = useMutation({
    mutationFn: creerEtablissement,
    onSuccess: onCree,
  });

  const erreur = creation.error instanceof ApiError ? creation.error : null;
  const erreurDuChamp = (champ: string) =>
    erreur?.champs.find((c) => c.champ === champ)?.contraintes[0];

  const modifier = (champ: keyof Saisie) => (valeur: string) =>
    setSaisie((precedent) => ({ ...precedent, [champ]: valeur }));

  const basculer = (id: string) =>
    setCochees((precedent) => {
      const suivant = new Set(precedent);

      if (suivant.has(id)) {
        suivant.delete(id);
      } else {
        suivant.add(id);
      }

      return suivant;
    });

  const envoyer = (evenement: React.FormEvent) => {
    evenement.preventDefault();

    if (!saisie.type || !saisie.ville_id) {
      return;
    }

    const dto: NouvelEtablissement = {
      nom: saisie.nom.trim(),
      ville_id: Number(saisie.ville_id),
      type: saisie.type,
      // Les champs vides ne partent PAS : le DTO les refuserait sur `email` et
      // `site_web`, et une chaîne vide en base n'est pas la même chose qu'un
      // champ non renseigné.
      ...texte('groupe', saisie.groupe),
      ...texte('adresse', saisie.adresse),
      ...texte('quartier', saisie.quartier),
      ...texte('tel', saisie.tel),
      ...texte('whatsapp', saisie.whatsapp),
      ...texte('email', saisie.email),
      ...texte('site_web', saisie.site_web),
      ...texte('langues', saisie.langues),
      ...texte('description', saisie.description),
      ...nombre('lat', saisie.lat),
      ...nombre('lng', saisie.lng),
      ...nombre('budget_min', saisie.budget_min),
      ...nombre('budget_max', saisie.budget_max),
      ...(cochees.size > 0 ? { caracteristiques: [...cochees].map(Number) } : {}),
    };

    creation.mutate(dto);
  };

  return (
    <form onSubmit={envoyer} style={carte}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Icon name="plus" size={18} color="#E63946" />
        <h2 style={{ font: "800 17px/1.2 'Inter', sans-serif", margin: 0, flex: 1 }}>
          Ajouter un établissement
        </h2>
        <Button variant="ghost" size="sm" type="button" onClick={onAnnuler}>
          Fermer
        </Button>
      </div>

      {erreur && <AlerteErreur>{erreur.message}</AlerteErreur>}

      <div style={grille}>
        <Champ
          label="Nom de l’établissement"
          valeur={saisie.nom}
          onChange={modifier('nom')}
          erreur={erreurDuChamp('nom')}
          requis
          placeholder="Groupe Scolaire Al Amal"
        />

        <Liste
          label="Ville"
          valeur={saisie.ville_id}
          onChange={modifier('ville_id')}
          erreur={erreurDuChamp('ville_id')}
          requis
          aide="Une fiche, une ville (RG01)."
          options={(referentiel.data?.villes ?? []).map((ville) => ({
            valeur: ville.id,
            libelle: ville.region ? `${ville.nom} — ${ville.region}` : ville.nom,
          }))}
          enChargement={referentiel.isPending}
        />

        <Liste
          label="Type"
          valeur={saisie.type}
          onChange={modifier('type')}
          erreur={erreurDuChamp('type')}
          requis
          options={TYPES.map((type) => ({ valeur: type, libelle: LIBELLE_TYPE[type] }))}
        />

        <Champ
          label="Groupe scolaire"
          valeur={saisie.groupe}
          onChange={modifier('groupe')}
          erreur={erreurDuChamp('groupe')}
          placeholder="Groupe Al Amal"
          aide="Laissez vide si l’établissement est seul. Un nom inconnu crée le groupe."
        />
      </div>

      <button type="button" onClick={() => setDetaillee(!detaillee)} style={bascule}>
        <Icon name={detaillee ? 'chevron-up' : 'chevron-down'} size={15} color="#1D3557" />
        {detaillee ? 'Masquer' : 'Renseigner'} les coordonnées et la présentation
      </button>

      {detaillee && (
        <>
          <div style={grille}>
            <Champ
              label="Adresse"
              valeur={saisie.adresse}
              onChange={modifier('adresse')}
              erreur={erreurDuChamp('adresse')}
              placeholder="12, rue Ibn Battouta"
            />
            <Champ
              label="Quartier"
              valeur={saisie.quartier}
              onChange={modifier('quartier')}
              erreur={erreurDuChamp('quartier')}
              placeholder="Maârif"
            />

            {/*
              LES COORDONNÉES FONT APPARAÎTRE LA FICHE SUR LA CARTE des
              résultats, et son bouton « Carte ». Sans elles, elle existe dans
              la liste mais nulle part sur le plan — ce qui, pour un parent
              qui cherche une école près de chez lui, revient à ne pas exister.
            */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Champ
                label="Latitude"
                valeur={saisie.lat}
                onChange={modifier('lat')}
                erreur={erreurDuChamp('lat')}
                placeholder="33.5883"
                aide="Clic droit sur Google Maps → le premier nombre."
              />
              <Champ
                label="Longitude"
                valeur={saisie.lng}
                onChange={modifier('lng')}
                erreur={erreurDuChamp('lng')}
                placeholder="-7.6325"
                aide="Le second. Négatif au Maroc."
              />
            </div>
            <Champ
              label="Téléphone"
              type="tel"
              valeur={saisie.tel}
              onChange={modifier('tel')}
              erreur={erreurDuChamp('tel')}
              placeholder="05 22 00 00 00"
            />
            <Champ
              label="WhatsApp"
              type="tel"
              valeur={saisie.whatsapp}
              onChange={modifier('whatsapp')}
              erreur={erreurDuChamp('whatsapp')}
              placeholder="06 12 34 56 78"
            />
            <Champ
              label="E-mail"
              type="email"
              valeur={saisie.email}
              onChange={modifier('email')}
              erreur={erreurDuChamp('email')}
              placeholder="contact@ecole.ma"
            />
            <Champ
              label="Site web"
              valeur={saisie.site_web}
              onChange={modifier('site_web')}
              erreur={erreurDuChamp('site_web')}
              placeholder="https://ecole-al-amal.ma"
            />
            <Champ
              label="Langues d’enseignement"
              valeur={saisie.langues}
              onChange={modifier('langues')}
              erreur={erreurDuChamp('langues')}
              placeholder="Français, Arabe, Anglais"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Champ
                label="Budget min. (MAD/an)"
                valeur={saisie.budget_min}
                onChange={modifier('budget_min')}
                erreur={erreurDuChamp('budget_min')}
                placeholder="15000"
              />
              <Champ
                label="Budget max."
                valeur={saisie.budget_max}
                onChange={modifier('budget_max')}
                erreur={erreurDuChamp('budget_max')}
                placeholder="32000"
              />
            </div>
          </div>

          <ZoneTexte
            label="Présentation"
            valeur={saisie.description}
            onChange={modifier('description')}
            erreur={erreurDuChamp('description')}
            lignes={4}
            placeholder="Ce que l’établissement met en avant : histoire, projet pédagogique, effectifs…"
          />

          {parCategorie.length > 0 && (
            <fieldset style={bloc}>
              <legend style={legende}>Caractéristiques</legend>
              <p style={{ ...indication, marginTop: 0 }}>
                Ce sont elles qui font remonter la fiche dans les filtres de recherche.
              </p>

              {parCategorie.map(({ categorie, valeurs }) => (
                <div key={categorie} style={{ marginTop: 12 }}>
                  <span style={sousTitre}>{LIBELLE_CATEGORIE[categorie]}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 7 }}>
                    {valeurs.map((valeur) => (
                      <PastilleCoche
                        key={valeur.id}
                        libelle={valeur.libelle}
                        cochee={cochees.has(valeur.id)}
                        onClick={() => basculer(valeur.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </fieldset>
          )}
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
        <Button type="submit" variant="primary" disabled={creation.isPending}>
          {creation.isPending ? 'Création…' : 'Créer la fiche'}
        </Button>
        <span style={indication}>
          Elle sera créée « en attente » : la publier reste une action à part, une fois
          l’abonnement encaissé.
        </span>
      </div>
    </form>
  );
}

/**
 * Liste déroulante native.
 *
 * Le `Select` du design system ne porte ni `id` ni `aria-describedby` : il ne
 * peut pas être relié à son message d'erreur. Sur un formulaire de saisie, où
 * l'erreur est la seule chose qui compte quand elle survient, c'est
 * rédhibitoire. L'apparence reprend celle de `Champ`.
 */
function Liste({
  label,
  valeur,
  onChange,
  options,
  requis,
  erreur,
  aide,
  enChargement,
}: {
  label: string;
  valeur: string;
  onChange: (valeur: string) => void;
  options: { valeur: string; libelle: string }[];
  requis?: boolean;
  erreur?: string;
  aide?: string;
  enChargement?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={etiquette}>
        {label}
        {requis && (
          <span style={{ color: '#E63946' }} aria-hidden>
            {' '}
            *
          </span>
        )}
      </label>
      <select
        value={valeur}
        required={requis}
        onChange={(evenement) => onChange(evenement.target.value)}
        aria-invalid={erreur ? true : undefined}
        style={{
          ...saisie,
          borderColor: erreur ? '#E63946' : '#E1E5EA',
          color: valeur ? '#1A1A1A' : '#9AA3AF',
        }}
      >
        <option value="">{enChargement ? 'Chargement…' : 'Choisir…'}</option>
        {options.map((option) => (
          <option key={option.valeur} value={option.valeur}>
            {option.libelle}
          </option>
        ))}
      </select>
      {erreur ? (
        <span style={{ ...indication, color: '#E63946' }} role="alert">
          {erreur}
        </span>
      ) : (
        aide && <span style={indication}>{aide}</span>
      )}
    </div>
  );
}

/** Case à cocher déguisée en pastille — la forme qu'a la maquette. */
function PastilleCoche({
  libelle,
  cochee,
  onClick,
}: {
  libelle: string;
  cochee: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={cochee}
      style={{
        border: `1px solid ${cochee ? '#1D3557' : '#E1E5EA'}`,
        background: cochee ? '#1D3557' : '#fff',
        color: cochee ? '#fff' : '#5A6472',
        font: "600 12.5px/1 'Inter', sans-serif",
        padding: '7px 13px',
        borderRadius: 18,
        cursor: 'pointer',
      }}
    >
      {libelle}
    </button>
  );
}

/** N'envoie le champ que s'il porte autre chose que des espaces. */
function texte<C extends string>(champ: C, valeur: string): Partial<Record<C, string>> {
  const nettoye = valeur.trim();

  return nettoye ? ({ [champ]: nettoye } as Record<C, string>) : {};
}

/** Idem pour un nombre — une saisie non numérique part telle quelle et l'API tranche. */
function nombre<C extends string>(champ: C, valeur: string): Partial<Record<C, number>> {
  const nettoye = valeur.trim();

  return nettoye ? ({ [champ]: Number(nettoye) } as Record<C, number>) : {};
}

const carte: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #EAE6DE',
  borderRadius: 16,
  padding: '18px 20px 20px',
};

const grille: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  columnGap: 16,
};

const bloc: React.CSSProperties = {
  border: '1px solid #EFEBE3',
  borderRadius: 12,
  padding: '12px 14px 16px',
  margin: '6px 0 0',
};

const legende: React.CSSProperties = {
  font: "700 12px/1 'Inter', sans-serif",
  color: '#1D3557',
  padding: '0 6px',
};

const sousTitre: React.CSSProperties = {
  font: "700 10.5px/1 'Inter', sans-serif",
  letterSpacing: '.7px',
  textTransform: 'uppercase',
  color: '#9AA3AF',
};

const bascule: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  background: 'none',
  border: 'none',
  padding: '4px 0 12px',
  font: "600 13px/1 'Inter', sans-serif",
  color: '#1D3557',
  cursor: 'pointer',
};

const etiquette: React.CSSProperties = {
  display: 'block',
  font: "600 12px/1 'Inter', sans-serif",
  color: '#2A313B',
  marginBottom: 6,
};

const saisie: React.CSSProperties = {
  width: '100%',
  height: 42,
  padding: '0 12px',
  font: "400 14px/1 'Inter', sans-serif",
  border: '1px solid #E1E5EA',
  borderRadius: 10,
  outline: 'none',
  background: '#fff',
};

const indication: React.CSSProperties = {
  display: 'block',
  font: "400 12px/1.4 'Inter', sans-serif",
  color: '#5A6472',
  marginTop: 4,
};
