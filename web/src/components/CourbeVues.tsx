import { formaterNombre } from '@/lib/formats';

/**
 * Courbe d'audience des écrans d'administration — tracé des maquettes
 * `isAdminDash` (600 × 150) et `isAdminStats` (600 × 210).
 *
 * PAS LE `BarChart` DU DESIGN SYSTEM : il écrit la valeur au-dessus de chaque
 * barre, dix pixels d'écart. Taillé pour six mois, il superposerait ici
 * trente et un nombres illisibles. Les deux maquettes dessinent d'ailleurs
 * une courbe.
 *
 * L'appelant décide de l'état vide : une série sans aucune vue n'est pas
 * tracée, une ligne plate au ras du cadre se lirait comme une donnée.
 */
export function CourbeVues({
  points,
  hauteurVue = 150,
  hauteurAffichee = 120,
  guides = 2,
  libelle,
}: {
  points: number[];
  /** Hauteur du `viewBox` — celle de la maquette. */
  hauteurVue?: number;
  hauteurAffichee?: number;
  /** Lignes horizontales de repère, réparties sur la hauteur. */
  guides?: number;
  libelle: string;
}) {
  const maximum = Math.max(...points, 0);

  if (points.length < 2 || maximum === 0) {
    return null;
  }

  const [gauche, droite, bas, haut] = [8, 592, hauteurVue - 10, 12];
  const coordonnees = points.map((valeur, rang) => {
    const x = gauche + ((droite - gauche) * rang) / (points.length - 1);
    const y = bas - ((bas - haut) * valeur) / maximum;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const aire = `M${gauche},${bas} L${coordonnees.join(' L')} L${droite},${bas} Z`;

  return (
    <svg
      viewBox={`0 0 600 ${hauteurVue}`}
      preserveAspectRatio="none"
      style={{ display: 'block', width: '100%', height: hauteurAffichee }}
      role="img"
      aria-label={`${libelle}, de 0 à ${formaterNombre(maximum)}`}
    >
      {Array.from({ length: guides }, (_, rang) => {
        const y = Math.round((hauteurVue * (rang + 1)) / (guides + 1));
        return <line key={y} x1="8" y1={y} x2="592" y2={y} stroke="#F1F3F6" strokeWidth="1" />;
      })}
      <path d={aire} fill="rgba(230,57,70,0.07)" />
      <polyline
        points={coordonnees.join(' ')}
        fill="none"
        stroke="#E63946"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
