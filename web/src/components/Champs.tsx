import { useId } from 'react';

/**
 * Primitives de formulaire — livrable 13 §3.
 *
 * L'ÉTIQUETTE EST LIÉE À LA SAISIE PAR `id`/`htmlFor`, pas seulement par
 * imbrication. Un lecteur d'écran annonce alors « Téléphone, obligatoire »
 * plutôt qu'« édition, vide », et cliquer sur le libellé donne le focus. C'est
 * la seule raison du `useId` : obtenir un identifiant unique même quand le
 * même champ est rendu deux fois sur la page.
 *
 * L'erreur est reliée par `aria-describedby` et portée par `aria-invalid` :
 * sans cela, un message affiché en rouge n'existe que pour ceux qui le voient.
 */

interface ProprietesChamp {
  label: string;
  valeur: string;
  onChange: (valeur: string) => void;
  erreur?: string;
  requis?: boolean;
  type?: 'text' | 'email' | 'password' | 'tel';
  placeholder?: string;
  aide?: string;
  autoComplete?: string;
}

export function Champ({
  label,
  valeur,
  onChange,
  erreur,
  requis,
  type = 'text',
  placeholder,
  aide,
  autoComplete,
}: ProprietesChamp) {
  const identifiant = useId();
  const idErreur = `${identifiant}-erreur`;
  const idAide = `${identifiant}-aide`;

  return (
    <div style={{ marginBottom: 14 }}>
      <label htmlFor={identifiant} style={etiquette}>
        {label}
        {requis && (
          <span style={{ color: '#E63946' }} aria-hidden>
            {' '}
            *
          </span>
        )}
      </label>
      <input
        id={identifiant}
        type={type}
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value)}
        placeholder={placeholder}
        required={requis}
        autoComplete={autoComplete}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? idErreur : aide ? idAide : undefined}
        style={{ ...saisie, borderColor: erreur ? '#E63946' : '#E1E5EA' }}
      />
      {aide && !erreur && (
        <span id={idAide} style={indication}>
          {aide}
        </span>
      )}
      {erreur && (
        <span id={idErreur} style={{ ...indication, color: '#E63946' }} role="alert">
          {erreur}
        </span>
      )}
    </div>
  );
}

export function ZoneTexte({
  label,
  valeur,
  onChange,
  erreur,
  requis,
  lignes = 4,
  placeholder,
  aide,
}: Omit<ProprietesChamp, 'type' | 'autoComplete'> & { lignes?: number }) {
  const identifiant = useId();
  const idErreur = `${identifiant}-erreur`;
  const idAide = `${identifiant}-aide`;

  return (
    <div style={{ marginBottom: 14 }}>
      <label htmlFor={identifiant} style={etiquette}>
        {label}
        {requis && (
          <span style={{ color: '#E63946' }} aria-hidden>
            {' '}
            *
          </span>
        )}
      </label>
      <textarea
        id={identifiant}
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value)}
        rows={lignes}
        placeholder={placeholder}
        required={requis}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? idErreur : aide ? idAide : undefined}
        style={{
          ...saisie,
          height: 'auto',
          padding: 10,
          resize: 'vertical',
          fontFamily: "'Inter', sans-serif",
          borderColor: erreur ? '#E63946' : '#E1E5EA',
        }}
      />
      {aide && !erreur && (
        <span id={idAide} style={indication}>
          {aide}
        </span>
      )}
      {erreur && (
        <span id={idErreur} style={{ ...indication, color: '#E63946' }} role="alert">
          {erreur}
        </span>
      )}
    </div>
  );
}

/**
 * Sélecteur d'étoiles — RG06.
 *
 * Un groupe de boutons radio, pas une rangée d'icônes cliquables : la
 * navigation au clavier (flèches) et l'annonce « 4 sur 5 » viennent alors du
 * navigateur, sans qu'on ait à les réimplémenter.
 */
export function ChoixNote({
  valeur,
  onChange,
  erreur,
}: {
  valeur: number;
  onChange: (note: number) => void;
  erreur?: string;
}) {
  const nom = useId();

  return (
    <fieldset style={{ border: 'none', padding: 0, margin: '0 0 14px' }}>
      <legend style={{ ...etiquette, padding: 0 }}>
        Votre note
        <span style={{ color: '#E63946' }} aria-hidden>
          {' '}
          *
        </span>
      </legend>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((note) => (
          <label
            key={note}
            title={`${note} sur 5`}
            style={{
              cursor: 'pointer',
              font: "700 26px/1 'Inter', sans-serif",
              color: note <= valeur ? '#E9A23B' : '#D4DAE2',
              lineHeight: 1,
            }}
          >
            <input
              type="radio"
              name={nom}
              value={note}
              checked={valeur === note}
              onChange={() => onChange(note)}
              style={positionHorsEcran}
            />
            <span aria-hidden>★</span>
            <span style={positionHorsEcran}>{note} sur 5</span>
          </label>
        ))}
      </div>
      {erreur && (
        <span style={{ ...indication, color: '#E63946' }} role="alert">
          {erreur}
        </span>
      )}
    </fieldset>
  );
}

/** Bouton primaire du design system — rouge accent, réservé à l'action principale. */
export function BoutonPrimaire({
  children,
  desactive,
  pleineLargeur,
}: {
  children: React.ReactNode;
  desactive?: boolean;
  pleineLargeur?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={desactive}
      style={{
        width: pleineLargeur ? '100%' : undefined,
        font: "600 15px/1 'Inter', sans-serif",
        color: '#fff',
        background: desactive ? '#E9A0A6' : '#E63946',
        border: 'none',
        borderRadius: 10,
        padding: '13px 22px',
        cursor: desactive ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/** Message d'erreur global d'un formulaire — annoncé dès son apparition. */
export function AlerteErreur({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      style={{
        font: "500 13px/1.5 'Inter', sans-serif",
        color: '#C42B38',
        background: '#FDE8EA',
        border: '1px solid #F5C6CB',
        borderRadius: 10,
        padding: '10px 12px',
        margin: '0 0 14px',
      }}
    >
      {children}
    </p>
  );
}

export const etiquette: React.CSSProperties = {
  display: 'block',
  font: "600 12px/1 'Inter', sans-serif",
  color: '#2A313B',
  marginBottom: 6,
};

export const saisie: React.CSSProperties = {
  width: '100%',
  height: 42,
  padding: '0 12px',
  font: "400 14px/1 'Inter', sans-serif",
  border: '1px solid #E1E5EA',
  borderRadius: 10,
  outline: 'none',
  background: '#fff',
  color: '#1A1A1A',
};

const indication: React.CSSProperties = {
  display: 'block',
  font: "400 12px/1.4 'Inter', sans-serif",
  color: '#5A6472',
  marginTop: 4,
};

/**
 * Sort l'élément du flux visuel SANS le retirer de l'arbre d'accessibilité.
 * `display: none` le masquerait aussi aux lecteurs d'écran, et le groupe de
 * boutons radio perdrait sa navigation au clavier.
 */
const positionHorsEcran: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};
