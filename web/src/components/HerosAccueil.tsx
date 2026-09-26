import { useEffect, useState } from 'react';
import type { TypeEtablissement } from '@/api/etablissements';

/**
 * Une diapositive du héros — un type d'établissement, sa signature, sa photo.
 *
 * LES PHOTOS SONT SERVIES LOCALEMENT, depuis `web/public/heros/`. La maquette
 * pointe Unsplash ; dépendre d'un CDN tiers pour la première image que voit un
 * visiteur, c'est accepter une page d'accueil vide le jour où ce CDN est lent
 * ou filtré — ce qui arrive déjà sur le poste de développement, où une requête
 * sur deux échoue.
 *
 * `node web/scripts/telecharger-heros.mjs` les rapatrie.
 *
 * CE SONT DES IMAGES DE REMPLACEMENT : elles portent l'intention de la
 * direction artistique, pas des établissements marocains réels. À remplacer par
 * les visuels du client avant la mise en ligne — une photo d'école américaine
 * sur un annuaire marocain finit toujours par se remarquer.
 */
interface Diapositive {
  type: TypeEtablissement;
  libelle: string;
  signature: string;
  photo: string;
}

/** Fichier local, rapatrié par `web/scripts/telecharger-heros.mjs`. */
const photo = (type: TypeEtablissement) => `/heros/${type}.jpg`;

const DIAPOSITIVES: Diapositive[] = [
  {
    type: 'creche',
    libelle: 'Crèche',
    signature: 'Les tout-petits, entre de bonnes mains.',
    photo: photo('creche'),
  },
  {
    type: 'primaire',
    libelle: 'Primaire',
    signature: 'Des fondations solides pour apprendre.',
    photo: photo('primaire'),
  },
  {
    type: 'college',
    libelle: 'Collège',
    signature: 'Accompagner chaque élève vers la réussite.',
    photo: photo('college'),
  },
  {
    type: 'lycee',
    libelle: 'Lycée',
    signature: 'Préparer l’avenir, viser le bac haut.',
    photo: photo('lycee'),
  },
  {
    type: 'universite',
    libelle: 'Université',
    signature: 'Des cursus supérieurs reconnus.',
    photo: photo('universite'),
  },
  {
    type: 'superieur',
    libelle: 'École supérieure',
    signature: 'Grandes écoles : ingénierie, commerce, santé.',
    photo: photo('superieur'),
  },
  {
    type: 'formation',
    libelle: 'Centre de formation',
    signature: 'Des compétences pour le monde de demain.',
    photo: photo('formation'),
  },
];

/**
 * Cadence du défilement — cinq secondes.
 *
 * La maquette tourne à trois secondes. Le client a demandé cinq, et il a
 * raison : trois secondes suffisent à peine à lire le surtitre et la signature
 * avant que la diapositive change, et le mouvement finit par agacer plus qu'il
 * n'informe. La même cadence vaut pour la galerie des fiches.
 */
const CADENCE_MS = 5000;

/**
 * Héros de l'accueil — écran `isHome` de la maquette.
 *
 * SEPT DIAPOSITIVES, UNE PAR TYPE D'ÉTABLISSEMENT (RG02), qui défilent toutes
 * les cinq secondes. Le surtitre affiche le type, le sous-titre sa signature :
 * en trente-cinq secondes, le visiteur a vu tout ce que l'annuaire couvre, sans
 * qu'on ait eu à le lui énumérer.
 *
 * LE TITRE, LUI, NE BOUGE PAS. « Trouvez la bonne école pour votre enfant » est
 * la promesse du site ; la faire clignoter la diluerait.
 *
 * `prefers-reduced-motion` NE COUPE QUE LE ZOOM, PAS LE DÉFILEMENT.
 *
 * J'avais d'abord tout arrêté : le visiteur ne voyait alors qu'une seule
 * diapositive, et les six autres types lui restaient invisibles. Or ce réglage
 * demande de réduire le mouvement SUPERFLU, pas de retirer du contenu. Ce qui
 * gêne, c'est le Ken Burns — un zoom continu pendant six secondes ; un fondu
 * de huit dixièmes toutes les cinq secondes est une transition, pas un
 * mouvement. Le zoom part, le défilement reste.
 *
 * LES PUCES SONT TOUJOURS LÀ. La maquette les masque
 * (`opacity:0;visibility:hidden`) parce que le défilement fait le travail ;
 * les rendre visibles coûte quatre pixels de haut et donne à qui le souhaite
 * le moyen d'aller droit au type qui l'intéresse.
 */
export function HerosAccueil() {
  const [index, setIndex] = useState(0);
  const [animationsReduites] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );

  useEffect(() => {
    const minuteur = window.setInterval(
      () => setIndex((actuel) => (actuel + 1) % DIAPOSITIVES.length),
      CADENCE_MS,
    );

    return () => window.clearInterval(minuteur);
  }, []);

  const courante = DIAPOSITIVES[index] ?? DIAPOSITIVES[0]!;

  return (
    <section
      style={{
        position: 'relative',
        height: 'clamp(300px, calc(100vh - 396px), 430px)',
        overflow: 'hidden',
        background: 'var(--e360-navy)',
      }}
    >
      {DIAPOSITIVES.map((diapo, rang) => {
        const active = rang === index;

        return (
          <div
            key={diapo.type}
            aria-hidden
            style={{ position: 'absolute', inset: 0, opacity: active ? 1 : 0, transition: 'opacity 1s ease' }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url('${diapo.photo}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                // Ken Burns : un lent rapprochement pendant que la diapositive
                // est visible. Posé seulement sur l'active, sinon les six
                // animations tourneraient en permanence pour rien.
                animation: active && !animationsReduites ? 'e3kenburns 6s ease-out forwards' : undefined,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(15,26,45,.30) 0%, rgba(15,26,45,.20) 40%, rgba(15,26,45,.78) 100%)',
              }}
            />
          </div>
        );
      })}

      <div
        className="e3-hero-contenu"
        style={{
          position: 'relative',
          maxWidth: 1180,
          margin: '0 auto',
          padding: '0 32px 84px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <div style={{ maxWidth: 680 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: 'rgba(255,255,255,.16)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,.25)',
                color: '#fff',
                font: "600 12px/1 'Inter', sans-serif",
                letterSpacing: '.3px',
                padding: '6px 13px',
                borderRadius: 20,
                textTransform: 'uppercase',
              }}
            >
              {courante.libelle}
            </span>
          </div>

          <h1
            className="e3-hero-titre"
            style={{
              margin: 0,
              color: '#fff',
              fontSize: 44,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: '-1.3px',
              textShadow: '0 2px 24px rgba(0,0,0,.25)',
            }}
          >
            Trouvez la bonne école
            <br />
            pour votre enfant
          </h1>

          {/*
            `aria-live="polite"` : la signature change toute seule. Sans cela,
            un lecteur d'écran lirait la première et ignorerait les cinq autres.
          */}
          <p
            aria-live="polite"
            style={{
              margin: '12px 0 0',
              color: 'rgba(255,255,255,.88)',
              fontSize: 19,
              lineHeight: 1.5,
              maxWidth: 540,
              minHeight: 29,
            }}
          >
            {courante.signature}
          </p>
        </div>
      </div>
      {
        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0 }}>
          <div
            style={{
              maxWidth: 1180,
              margin: '0 auto',
              padding: '0 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {DIAPOSITIVES.map((diapo, rang) => (
              <button
                key={diapo.type}
                type="button"
                onClick={() => setIndex(rang)}
                aria-label={diapo.libelle}
                aria-current={rang === index}
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0,
                  height: 4,
                  width: rang === index ? 46 : 26,
                  background: rang === index ? '#E63946' : 'rgba(255,255,255,.5)',
                  borderRadius: 4,
                  transition: 'all .4s ease',
                }}
              />
            ))}
          </div>
        </div>
      }
    </section>
  );
}
