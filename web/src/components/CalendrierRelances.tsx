import { useMemo, useState } from 'react';

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/**
 * Calendrier du mois — `agendaCells` de la maquette `isAgenda`.
 *
 * LUNDI EN PREMIER, comme la maquette et comme on lit un calendrier au Maroc.
 * `getDay()` rend 0 pour dimanche : le décalage `(jour + 6) % 7` remet lundi
 * en tête, et l'oublier décale la grille entière d'une colonne — une erreur
 * qui ne se voit qu'en comptant les cases un jour de fin de mois.
 *
 * SIX SEMAINES TOUJOURS, soit 42 cases. Une grille à hauteur variable ferait
 * sauter le contenu sous elle d'un mois à l'autre ; les jours des mois voisins
 * sont grisés plutôt que vides, pour qu'une relance du 1er du mois suivant
 * reste visible et cliquable.
 *
 * TOUT SE CALCULE EN HEURE LOCALE, jamais en UTC. Une relance prévue le 3 à
 * 00 h 30 au Maroc est le 2 à 23 h 30 en UTC : lire la date en UTC la
 * placerait la veille, et le commercial chercherait une tâche au mauvais jour.
 */
export function CalendrierRelances({
  dates,
  jourSelectionne,
  onJour,
}: {
  /** Dates ISO des relances non faites — plusieurs peuvent tomber le même jour. */
  dates: string[];
  /** `null` : aucun jour choisi, la liste montre tout. */
  jourSelectionne: string | null;
  onJour: (jour: string | null) => void;
}) {
  const [mois, setMois] = useState(() => debutDuMois(new Date()));

  const parJour = useMemo(() => {
    const compte = new Map<string, number>();

    for (const date of dates) {
      const cle = cleLocale(new Date(date));
      compte.set(cle, (compte.get(cle) ?? 0) + 1);
    }

    return compte;
  }, [dates]);

  const cases = useMemo(() => grilleDuMois(mois), [mois]);
  const aujourdhui = cleLocale(new Date());

  return (
    <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Fleche libelle="Mois précédent" onClick={() => setMois(decaler(mois, -1))}>
          ‹
        </Fleche>
        <span
          style={{
            flex: 1,
            textAlign: 'center',
            font: "700 15px/1 'Inter', sans-serif",
            textTransform: 'capitalize',
          }}
        >
          {new Intl.DateTimeFormat('fr-MA', { month: 'long', year: 'numeric' }).format(mois)}
        </span>
        <Fleche libelle="Mois suivant" onClick={() => setMois(decaler(mois, 1))}>
          ›
        </Fleche>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {JOURS.map((lettre, rang) => (
          <div
            key={`${lettre}-${rang}`}
            aria-hidden
            style={{
              textAlign: 'center',
              font: "700 11px/1 'Inter', sans-serif",
              color: '#9AA3AF',
              paddingBottom: 6,
            }}
          >
            {lettre}
          </div>
        ))}

        {cases.map((jour) => {
          const cle = cleLocale(jour);
          const duMois = jour.getMonth() === mois.getMonth();
          const relances = parJour.get(cle) ?? 0;
          const choisi = cle === jourSelectionne;
          const cestAujourdhui = cle === aujourdhui;

          return (
            <button
              key={cle}
              type="button"
              // Re-cliquer le jour choisi le désélectionne : sans cela, il
              // faudrait chercher un bouton « tout afficher » ailleurs.
              onClick={() => onJour(choisi ? null : cle)}
              aria-pressed={choisi}
              aria-label={`${jour.toLocaleDateString('fr-MA')} — ${relances} relance(s)`}
              style={{
                position: 'relative',
                minHeight: 40,
                borderRadius: 9,
                cursor: 'pointer',
                font: `${choisi || cestAujourdhui ? 800 : 600} 13px/1 'Inter', sans-serif`,
                border: cestAujourdhui && !choisi ? '1.5px solid #1D3557' : '1.5px solid transparent',
                background: choisi ? '#E63946' : 'transparent',
                color: choisi ? '#fff' : duMois ? '#2A313B' : '#C9D2DE',
              }}
            >
              {jour.getDate()}
              {relances > 0 && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    bottom: 5,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: choisi ? '#fff' : '#E63946',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {jourSelectionne && (
        <button
          type="button"
          onClick={() => onJour(null)}
          style={{
            marginTop: 12,
            border: 'none',
            background: 'transparent',
            color: '#1D3557',
            font: "600 12.5px/1 'Inter', sans-serif",
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Afficher toutes les relances
        </button>
      )}
    </div>
  );
}

function Fleche({
  libelle,
  onClick,
  children,
}: {
  libelle: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={libelle}
      onClick={onClick}
      style={{
        border: '1px solid #EAE6DE',
        background: '#fff',
        borderRadius: 8,
        width: 30,
        height: 30,
        cursor: 'pointer',
        font: "700 16px/1 'Inter', sans-serif",
        color: '#5A6472',
      }}
    >
      {children}
    </button>
  );
}

/** `AAAA-MM-JJ` en heure LOCALE — `toISOString()` basculerait en UTC. */
export function cleLocale(date: Date): string {
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${mois}-${jour}`;
}

function debutDuMois(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function decaler(mois: Date, pas: number): Date {
  return new Date(mois.getFullYear(), mois.getMonth() + pas, 1);
}

/** Les 42 jours affichés, du lundi précédant le 1er au samedi de la 6ᵉ semaine. */
function grilleDuMois(mois: Date): Date[] {
  const premier = new Date(mois.getFullYear(), mois.getMonth(), 1);
  // `getDay()` rend 0 pour dimanche : ce décalage remet lundi en tête.
  const retrait = (premier.getDay() + 6) % 7;
  const depart = new Date(mois.getFullYear(), mois.getMonth(), 1 - retrait);

  return Array.from(
    { length: 42 },
    (_, rang) => new Date(depart.getFullYear(), depart.getMonth(), depart.getDate() + rang),
  );
}
