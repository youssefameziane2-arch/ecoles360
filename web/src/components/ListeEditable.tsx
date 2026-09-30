import { Button } from '@/ds/composants';

export interface ColonneListe {
  cle: string;
  label: string;
  /** Une ligne incomplète n'est jamais enregistrée : ces colonnes sont exigées. */
  requise?: boolean;
  aide?: string;
  lignes?: number;
}

/**
 * Liste de lignes à champs — équipe, FAQ, chiffres, horaires, projets.
 *
 * ÉCRITE APRÈS UNE PERTE DE DONNÉES SILENCIEUSE, et c'est ce qu'il faut
 * retenir. Ces listes se saisissaient d'abord dans une zone de texte, une
 * entrée par ligne, champs séparés par « | ». Qui tapait une question sans
 * barre verticale voyait « Enregistré » s'afficher — et sa saisie était
 * écartée au passage, parce qu'une ligne incomplète ne peut pas être envoyée
 * à moitié sans faire refuser l'enregistrement entier en 422.
 *
 * Le défaut n'était pas dans le filtrage, qui est juste, mais dans le fait de
 * demander une syntaxe là où il fallait des champs. Un formulaire qui perd ce
 * qu'on lui confie, sans le dire, est pire qu'un formulaire qui refuse.
 *
 * UNE LIGNE INCOMPLÈTE EST MONTRÉE, PAS SUPPRIMÉE. Elle porte un avertissement
 * visible tant qu'il lui manque un champ obligatoire, et le bouton
 * d'enregistrement de l'écran s'en sert pour prévenir.
 */
export function ListeEditable({
  titre,
  aide,
  colonnes,
  valeurs,
  onChange,
  libelleAjout,
}: {
  titre: string;
  aide?: string;
  colonnes: ColonneListe[];
  valeurs: Record<string, string>[];
  onChange: (valeurs: Record<string, string>[]) => void;
  libelleAjout: string;
}) {
  const majLigne = (rang: number, cle: string, valeur: string) =>
    onChange(valeurs.map((ligne, i) => (i === rang ? { ...ligne, [cle]: valeur } : ligne)));

  const ligneVide = Object.fromEntries(colonnes.map((c) => [c.cle, '']));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <p style={{ font: "600 13.5px/1.4 'Inter', sans-serif", color: '#1A1A1A', margin: 0 }}>
          {titre}
        </p>
        {aide && (
          <p
            style={{
              font: "400 12.5px/1.5 'Inter', sans-serif",
              color: '#9AA3AF',
              margin: '3px 0 0',
            }}
          >
            {aide}
          </p>
        )}
      </div>

      {valeurs.length === 0 && (
        <p style={{ font: "400 13px/1.5 'Inter', sans-serif", color: '#9AA3AF', margin: 0 }}>
          Aucune entrée — la rubrique correspondante n’apparaîtra pas sur la fiche.
        </p>
      )}

      {valeurs.map((ligne, rang) => {
        const incomplete = colonnes.some((c) => c.requise && !ligne[c.cle]?.trim());

        return (
          <div
            key={rang}
            style={{
              border: `1px solid ${incomplete ? '#F0CDD0' : '#EAE6DE'}`,
              background: incomplete ? '#FDF6F6' : '#FBFAF7',
              borderRadius: 11,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
            }}
          >
            {colonnes.map((colonne) =>
              colonne.lignes ? (
                <label key={colonne.cle} style={{ display: 'block' }}>
                  <span style={etiquette}>
                    {colonne.label}
                    {colonne.requise && <span style={{ color: '#C42B38' }}> *</span>}
                  </span>
                  <textarea
                    rows={colonne.lignes}
                    value={ligne[colonne.cle] ?? ''}
                    onChange={(e) => majLigne(rang, colonne.cle, e.target.value)}
                    style={{ ...saisie, resize: 'vertical', padding: '9px 11px', height: 'auto' }}
                  />
                </label>
              ) : (
                <label key={colonne.cle} style={{ display: 'block' }}>
                  <span style={etiquette}>
                    {colonne.label}
                    {colonne.requise && <span style={{ color: '#C42B38' }}> *</span>}
                  </span>
                  <input
                    value={ligne[colonne.cle] ?? ''}
                    onChange={(e) => majLigne(rang, colonne.cle, e.target.value)}
                    placeholder={colonne.aide}
                    style={saisie}
                  />
                </label>
              ),
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {incomplete && (
                <span style={{ font: "500 12px/1.4 'Inter', sans-serif", color: '#B3242F' }}>
                  Incomplète — elle ne sera pas enregistrée.
                </span>
              )}
              <span style={{ flex: 1 }} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(valeurs.filter((_, i) => i !== rang))}
              >
                Retirer
              </Button>
            </div>
          </div>
        );
      })}

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...valeurs, ligneVide])}
        >
          {libelleAjout}
        </Button>
      </div>
    </div>
  );
}

const etiquette: React.CSSProperties = {
  display: 'block',
  font: "600 12px/1.4 'Inter', sans-serif",
  color: '#5A6472',
  marginBottom: 4,
};

const saisie: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: 38,
  padding: '0 11px',
  font: "400 13.5px/1.5 'Inter', sans-serif",
  color: '#1A1A1A',
  background: '#fff',
  border: '1px solid #E1E5EA',
  borderRadius: 9,
};
