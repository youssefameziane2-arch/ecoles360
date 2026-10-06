import { useQuery } from '@tanstack/react-query';
import { chargerVilles, LIBELLE_TYPE, rechercherEtablissements } from '@/api/etablissements';
import { formaterNombre } from '@/lib/formats';

/**
 * Bande de chiffres — `trustStats` de la maquette, sur l'accueil et « À propos ».
 *
 * LES QUATRE CHIFFRES DE LA MAQUETTE NE SONT PAS TOUS MESURABLES. Elle affiche
 * « 1 200+ établissements · 24 villes · 85 000 parents par mois · ★ 4,7 ». Les
 * deux premiers se comptent en base. Les deux autres, non : rien ne trace les
 * visites du site (voir B-40), et une note moyenne de toutes les écoles n'a de
 * sens que lorsqu'un nombre d'avis la porte — sur un catalogue qui démarre,
 * elle vaudrait la note de la seule école notée.
 *
 * Les deux chiffres sans source sont donc REMPLACÉS, pas inventés : le nombre
 * de types d'établissement (RG02) et la gratuité pour les parents. Tous deux
 * sont vrais le premier jour comme le millième, et c'est le propos du bandeau.
 *
 * COMPOSANT PARTAGÉ parce que la maquette pose la même liste sur deux écrans.
 * Dupliquée, elle aurait divergé — l'accueil disant une chose et « À propos »
 * une autre, sur la même base.
 */
export function BandeauChiffres() {
  const villes = useQuery({ queryKey: ['villes'], queryFn: chargerVilles });

  /**
   * MÊME CLÉ QUE L'ACCUEIL : la requête est déjà en cache quand l'accueil
   * affiche ses fiches à la une, et seul `meta.total` nous intéresse ici.
   */
  const fiches = useQuery({
    queryKey: ['etablissements', 'une'],
    queryFn: () => rechercherEtablissements({ per_page: 4 }),
  });

  /**
   * LES VILLES OÙ UNE FICHE EST PUBLIÉE, pas le référentiel entier : une ville
   * du référentiel sans aucune fiche validée n'est pas couverte. Compter
   * `villes.length` annoncerait douze villes à un parent sur une base qui n'en
   * sert que deux.
   */
  const villesCouvertes = villes.data
    ? String(villes.data.filter((ville) => ville.nb_etablissements > 0).length)
    : '—';

  return (
    <div className="e3-truststats">
      <Chiffre
        valeur={fiches.data ? formaterNombre(fiches.data.meta.total) : '—'}
        libelle="Établissements référencés"
      />
      <Chiffre valeur={villesCouvertes} libelle="Villes couvertes" />
      {/* Dérivé du référentiel plutôt qu'écrit en dur : un chiffre littéral
          ne suit pas l'ajout d'un type (RG02), et finit par mentir. */}
      <Chiffre
        valeur={String(Object.keys(LIBELLE_TYPE).length)}
        libelle="Types d'établissements"
      />
      <Chiffre valeur="0 MAD" libelle="Pour les parents, toujours" />
    </div>
  );
}

function Chiffre({ valeur, libelle }: { valeur: string; libelle: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        borderLeft: '2px solid rgba(255,255,255,.14)',
        paddingLeft: 22,
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1px', color: '#fff' }}>
        {valeur}
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--e360-navy-soft)', fontWeight: 500 }}>
        {libelle}
      </div>
    </div>
  );
}
