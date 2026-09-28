import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { EtablissementListe } from '@/api/etablissements';
import { LIBELLE_TYPE } from '@/api/etablissements';
import { formaterNote } from '@/lib/formats';

/**
 * Carte des résultats — bouton « Carte » de l'écran `isResults`.
 *
 * ELLE REMPLACE UN CADRE GOOGLE QUI NE MONTRAIT RIEN. L'écran affichait déjà
 * une carte, mais centrée sur la ville et SANS AUCUN MARQUEUR : un parent y
 * voyait Casablanca, jamais les écoles qu'il venait de filtrer. Une carte qui
 * ne situe pas les résultats ne sert qu'à remplir une colonne.
 *
 * LEAFLET ET OPENSTREETMAP, comme le prévoit le schéma (`lat`/`lng` y portent
 * le commentaire « Leaflet / OSM »). Pas de clé d'API, pas de quota, pas de
 * compte à ouvrir — et les tuiles restent gratuites à l'échelle d'un annuaire
 * marocain.
 *
 * LES FICHES SANS COORDONNÉES SONT SIMPLEMENT ABSENTES, jamais posées au
 * centre de la ville par défaut : un marqueur au mauvais endroit est pire
 * qu'un marqueur manquant — il envoie un parent à une adresse qui n'est pas
 * la bonne.
 */

/** Centre du Maroc, quand aucune fiche localisée ne permet de cadrer. */
const CENTRE_MAROC: [number, number] = [31.7917, -7.0926];

/**
 * Épingle dessinée en HTML plutôt qu'en image.
 *
 * Leaflet cherche ses icônes par défaut à des chemins relatifs que le bundler
 * ne résout pas — le défaut connu du marqueur invisible. Un `divIcon` évite
 * la question, et permet au passage de teinter les fiches sponsorisées, qui
 * remontent déjà en tête de liste (RG19).
 */
function epingle(sponsorise: boolean): L.DivIcon {
  const couleur = sponsorise ? '#E63946' : '#1D3557';

  return L.divIcon({
    className: 'e3-epingle',
    html: `<span style="
      display:block;width:18px;height:18px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);background:${couleur};
      border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);
    "></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -18],
  });
}

export function CarteResultats({
  fiches,
  cible,
}: {
  fiches: EtablissementListe[];
  /** Slug de la fiche à centrer — le bouton « Carte » d'une carte de résultat. */
  cible?: string | null;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const carte = useRef<L.Map | null>(null);
  const couche = useRef<L.LayerGroup | null>(null);
  const marqueurs = useRef<Map<string, L.Marker>>(new Map());
  const naviguer = useNavigate();

  // La carte est créée UNE FOIS et réutilisée : la recréer à chaque
  // changement de filtre ferait clignoter les tuiles et perdrait le zoom que
  // le visiteur vient de régler.
  useEffect(() => {
    if (!conteneur.current || carte.current) {
      return;
    }

    carte.current = L.map(conteneur.current, {
      center: CENTRE_MAROC,
      zoom: 5,
      scrollWheelZoom: false, // sinon la molette capture le défilement de la page
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap',
    }).addTo(carte.current);

    couche.current = L.layerGroup().addTo(carte.current);

    return () => {
      carte.current?.remove();
      carte.current = null;
      couche.current = null;
    };
  }, []);

  useEffect(() => {
    if (!carte.current || !couche.current) {
      return;
    }

    couche.current.clearLayers();
    marqueurs.current.clear();

    const localisees = fiches.filter((fiche) => fiche.lat && fiche.lng);

    for (const fiche of localisees) {
      const position: [number, number] = [Number(fiche.lat), Number(fiche.lng)];

      const marqueur = L.marker(position, { icon: epingle(fiche.sponsorise), title: fiche.nom })
        .addTo(couche.current)
        .bindPopup(
          `<strong>${echapper(fiche.nom)}</strong><br>` +
            `${LIBELLE_TYPE[fiche.type]} · ${echapper(fiche.ville.nom)}` +
            (fiche.nb_avis > 0 ? `<br>★ ${formaterNote(fiche.note_moy)}` : '') +
            `<br><a href="/etablissements/${fiche.slug}" data-fiche="${fiche.slug}">Voir la fiche</a>`,
        );

      marqueurs.current.set(fiche.slug, marqueur);
    }

    // Le cadrage suit les résultats : filtrer sur Rabat doit y emmener la
    // carte, sans que le visiteur ait à la déplacer lui-même.
    if (localisees.length > 0) {
      carte.current.fitBounds(
        L.latLngBounds(localisees.map((f) => [Number(f.lat), Number(f.lng)] as [number, number])),
        { padding: [40, 40], maxZoom: 14 },
      );
    } else {
      carte.current.setView(CENTRE_MAROC, 5);
    }
  }, [fiches]);

  /**
   * Le bouton « Carte » d'un résultat amène ICI, il n'ouvre pas Google Maps.
   *
   * C'est le sens de cette colonne : voir où se trouve une école SANS quitter
   * ses résultats ni perdre ses filtres. Un lien externe faisait exactement
   * l'inverse — il envoyait le visiteur chez un tiers pour une information
   * déjà affichée à trente centimètres.
   */
  useEffect(() => {
    if (!carte.current || !cible) return;

    const marqueur = marqueurs.current.get(cible);
    if (!marqueur) return;

    carte.current.flyTo(marqueur.getLatLng(), 15, { duration: 0.8 });
    marqueur.openPopup();
  }, [cible, fiches]);


  /**
   * Le lien de la bulle passe par le routeur, au lieu de recharger le site.
   *
   * Leaflet pose son HTML hors de React ; un `<a href>` y déclencherait une
   * navigation complète, rechargeant le bundle et perdant les filtres en
   * cours. On l'intercepte.
   */
  useEffect(() => {
    const element = conteneur.current;
    if (!element) return;

    const surClic = (evenement: MouseEvent) => {
      const cible = (evenement.target as HTMLElement).closest<HTMLAnchorElement>('a[data-fiche]');

      if (cible) {
        evenement.preventDefault();
        naviguer(`/etablissements/${cible.dataset.fiche}`);
      }
    };

    element.addEventListener('click', surClic);

    return () => element.removeEventListener('click', surClic);
  }, [naviguer]);

  const sansCoordonnees = fiches.length - fiches.filter((f) => f.lat && f.lng).length;

  return (
    <>
      <div ref={conteneur} style={{ flex: 1, minHeight: 320 }} />

      {/*
        DIRE CE QUI MANQUE PLUTÔT QUE DE LE TAIRE. Un parent qui compte six
        résultats et quatre épingles doit savoir pourquoi, sinon il croit la
        carte fautive — ou pire, que deux écoles ont disparu.
      */}
      {sansCoordonnees > 0 && (
        <p
          style={{
            font: "400 12px/1.5 'Inter', sans-serif",
            color: '#5A6472',
            margin: 0,
            padding: '8px 14px',
            borderTop: '1px solid #EAE6DE',
            flex: 'none',
          }}
        >
          {sansCoordonnees} établissement{sansCoordonnees > 1 ? 's' : ''} sans position connue
          {sansCoordonnees > 1 ? ' ne figurent' : ' ne figure'} pas sur la carte.
        </p>
      )}
    </>
  );
}

/** Le contenu d'une bulle est du HTML : un nom d'école ne doit pas s'y exécuter. */
function echapper(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
