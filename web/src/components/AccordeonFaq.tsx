import { useState } from 'react';

/**
 * Accordéon de questions — maquette « Centre d'aide » et bloc FAQ de l'accueil.
 *
 * NON, CE N'EST PAS `FaqAccordion` DU DESIGN SYSTEM, ET C'EST VOULU. Le
 * composant du design system affiche un chevron gris qui pivote, sur des lignes
 * de 15 px ; la maquette des deux écrans publics affiche un « + » rouge de
 * 23 px qui devient « − », sur des lignes de 18 px. Les deux existent
 * réellement dans la livraison, et c'est la maquette que le client a validée
 * pour ces écrans-là. `FaqAccordion` reste disponible pour la page profil, où
 * la maquette l'utilise tel quel.
 *
 * UNE SEULE RÉPONSE OUVERTE À LA FOIS, comme dans la maquette : sur mobile,
 * plusieurs réponses dépliées repousseraient les questions suivantes hors de
 * l'écran.
 */
export function AccordeonFaq({
  items,
  ouvertParDefaut,
}: {
  items: { id: string; question: string; reponse: string }[];
  /** Identifiant déplié à l'arrivée — l'accueil ouvre la première question. */
  ouvertParDefaut?: string;
}) {
  const [ouvert, setOuvert] = useState<string | null>(ouvertParDefaut ?? null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => {
        const deplie = ouvert === item.id;

        return (
          <div
            key={item.id}
            style={{
              background: '#fff',
              border: '1px solid #EAE6DE',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              // `aria-expanded` et un vrai `<button>` : la maquette pose un
              // `div` cliquable, qu'aucun clavier ni lecteur d'écran
              // n'atteindrait. L'apparence est identique, le comportement non.
              aria-expanded={deplie}
              onClick={() => setOuvert(deplie ? null : item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '18px 22px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                font: "600 15.5px/1.4 'Inter', sans-serif",
                color: '#1A1A1A',
              }}
            >
              <span>{item.question}</span>
              <span
                aria-hidden
                style={{
                  fontSize: 23,
                  color: '#E63946',
                  fontWeight: 400,
                  lineHeight: 1,
                  flex: 'none',
                  marginLeft: 16,
                }}
              >
                {deplie ? '−' : '+'}
              </span>
            </button>

            {deplie && (
              <div
                style={{
                  padding: '0 22px 20px',
                  font: "400 14.5px/1.65 'Inter', sans-serif",
                  color: '#5A6472',
                }}
              >
                {item.reponse}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
