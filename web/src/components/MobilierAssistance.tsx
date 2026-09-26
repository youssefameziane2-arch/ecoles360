import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chargerConseillers, type Conseiller } from '@/api/conseillers';
import { lienTelephone, lienWhatsApp } from '@/lib/telephone';

/**
 * Numéro du conseiller — propriété `helpPhone` de la maquette.
 *
 * CE NUMÉRO APPELLE UNE VRAIE PERSONNE. Celui de la maquette
 * (« 06 61 18 98 21 ») est repris comme valeur de repli pour que l'écran ne
 * soit pas vide en développement, mais il ne doit PAS partir en production :
 * à la mise en ligne, chaque visiteur qui clique déclenche un appel ou un
 * message WhatsApp chez son propriétaire.
 *
 * Le vrai numéro se pose dans `web/.env` :
 *
 *     VITE_TELEPHONE_CONSEILLER="06 12 34 56 78"
 *
 * Il passera plus tard dans l'écran « Contenu du site », que la maquette
 * prévoit — le jour où ce bloc sera construit, cette constante disparaîtra.
 */
const TELEPHONE = import.meta.env.VITE_TELEPHONE_CONSEILLER ?? '06 61 18 98 21';


/**
 * Mobilier d'assistance — bannière d'aide et bouton WhatsApp flottants.
 *
 * CE N'EST PAS UNE SECTION D'ACCUEIL, c'est du mobilier de site : la maquette
 * les pose en `position:fixed`, l'un en bas à droite, l'autre en bas à gauche,
 * au-dessus de tout le reste. Les avoir crus sectionnels est précisément ce qui
 * les avait fait manquer à l'inventaire.
 *
 * LA FERMETURE NE DURE QUE LE TEMPS DE LA PAGE, comme dans la maquette
 * (`helpBannerOpen` y est un simple état de composant). J'avais d'abord
 * mémorisé le refus pour de bon : c'était doublement faux. La maquette ne le
 * fait pas, et surtout une bannière fermée définitivement rendrait la rotation
 * des conseillers sans objet — le visiteur n'en verrait plus jamais aucun.
 */
export function MobilierAssistance() {
  const conseillers = useQuery({
    queryKey: ['conseillers'],
    queryFn: chargerConseillers,
    // Une heure : la liste des conseillers ne bouge pas dans une session.
    staleTime: 3_600_000,
  });

  /**
   * UN CONSEILLER PAR VISITE, TIRÉ AU SORT — et non un défilement.
   *
   * La demande était « qu'il change toutes les cinq secondes ou à chaque
   * navigation ». J'ai retenu la seconde : un numéro qui se remplace pendant
   * qu'on le recopie sur son téléphone est un numéro qu'on compose faux. Le
   * tirage au hasard à chaque chargement répartit les appels aussi bien, sans
   * dérober l'information sous le pouce du visiteur.
   *
   * L'index est figé au montage : la bannière ne doit pas changer de conseiller
   * parce qu'une autre requête a provoqué un rendu.
   */
  const [tirage] = useState(() => Math.random());

  const [ouverte, setOuverte] = useState(true);

  const liste = conseillers.data ?? [];
  const conseiller: Conseiller | null =
    liste.length > 0 ? (liste[Math.floor(tirage * liste.length)] ?? liste[0]!) : null;

  // Repli sur le numéro configuré tant que l'API n'a pas répondu, ou si aucun
  // conseiller ne porte de ligne : la bannière ne doit jamais afficher un vide.
  const numero = conseiller?.telephone ?? TELEPHONE;

  return (
    <>
      {ouverte && (
        <div
          className="e3-banniere-aide"
          style={{
            position: 'fixed',
            bottom: 22,
            right: 22,
            zIndex: 70,
            maxWidth: 560,
            background: '#fff',
            border: '1px solid #ECEEF1',
            borderRadius: 16,
            boxShadow: '0 14px 40px rgba(26,26,26,.18)',
            // Marge droite élargie : elle réserve la place de la croix, qui
            // sort du flux pour aller se caler dans le coin.
            padding: '14px 44px 14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            className="e3-banniere-avatar"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#FDE8EA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E63946" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z" />
              <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" />
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 170 }}>
            <div style={{ font: "800 15px/1.3 'Inter', sans-serif", letterSpacing: '-0.2px' }}>
              Besoin d&rsquo;aide pour choisir&nbsp;?
            </div>
            <p style={{ margin: '3px 0 0', font: "400 13px/1.5 'Inter', sans-serif", color: '#5A6472' }}>
              Notre équipe vous accompagne{' '}
              <span style={{ color: '#E63946', fontWeight: 600 }}>gratuitement</span> pour trouver
              l&rsquo;établissement idéal.
            </p>
          </div>

          <a
            href={lienTelephone(numero)}
            className="e3-banniere-tel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              border: '1px solid #ECEEF1',
              borderRadius: 12,
              background: '#FBFAF7',
              flex: 'none',
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#FDE8EA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E63946" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <span>
              <span
                style={{
                  display: 'block',
                  font: "700 10.5px/1.3 'Inter', sans-serif",
                  letterSpacing: '.8px',
                  textTransform: 'uppercase',
                  color: '#9AA3AF',
                }}
              >
                Un conseiller vous rappelle
              </span>
              <span
                style={{
                  display: 'block',
                  font: "800 15px/1.3 'Inter', sans-serif",
                  letterSpacing: '-0.2px',
                  color: '#1D3557',
                }}
              >
                {numero}
              </span>
              {/* LE NOM DU CONSEILLER, comme la maquette : un numéro anonyme
                  se compose moins volontiers qu'un nom à qui parler. */}
              {conseiller && (
                <span
                  style={{
                    display: 'block',
                    font: "400 11px/1.3 'Inter', sans-serif",
                    color: '#5A6472',
                    marginTop: 1,
                  }}
                >
                  {conseiller.nom}
                </span>
              )}
            </span>
          </a>

          <button
            type="button"
            onClick={() => setOuverte(false)}
            title="Fermer"
            aria-label="Fermer la bannière d’aide"
            style={{
              // EN HAUT À DROITE, ET NON CENTRÉE VERTICALEMENT. Dans le flux,
              // la croix se centrait sur la hauteur de la carte : sur une
              // bannière de 150 px, elle flottait au milieu du vide, loin du
              // coin où l'œil va chercher une fermeture. Sortie du flux, elle
              // reste au bon endroit quelle que soit la hauteur du contenu.
              position: 'absolute',
              top: 8,
              right: 8,
              border: 'none',
              background: 'transparent',
              color: '#9AA3AF',
              width: 30,
              height: 30,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <a
        href={lienWhatsApp(numero)}
        target="_blank"
        rel="noreferrer"
        title="Discuter avec notre équipe sur WhatsApp"
        aria-label="Discuter avec notre équipe sur WhatsApp"
        style={{
          position: 'fixed',
          bottom: 22,
          left: 22,
          zIndex: 70,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#2E9E5B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 26px rgba(46,158,91,.4)',
        }}
      >
        <IconeWhatsApp taille={27} />
      </a>
    </>
  );
}

/** Glyphe WhatsApp de la maquette — repris tel quel. */
export function IconeWhatsApp({ taille = 17, couleur = '#fff' }: { taille?: number; couleur?: string }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill={couleur} aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3.2-.7s-3.7-3.3-3.8-3.5c-.1-.2-1-1.3-1-2.5s.6-1.8.8-2c.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .5.4l.8 1.9c.1.1.1.3 0 .5l-.4.5-.3.3c-.1.1-.3.3-.1.6s.7 1.2 1.5 1.9c1 .9 1.8 1.1 2.1 1.3.3.1.5.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.7-.1 1.4Z" />
    </svg>
  );
}

export const TELEPHONE_CONSEILLER = TELEPHONE;
export const LIEN_TELEPHONE = lienTelephone(TELEPHONE);
export const LIEN_WHATSAPP = lienWhatsApp(TELEPHONE);
