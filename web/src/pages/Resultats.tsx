import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LIBELLE_TYPE,
  chargerNiveauxFilieres,
  FAMILLES_PAR_DEFAUT,
  FAMILLES_PAR_TYPE,
  LIBELLE_FAMILLE,
  chargerVilles,
  rechercherEtablissements,
  tracerEvenement,
  type EtablissementListe,
  type CategorieCaracteristique,
  type FiltresRecherche,
  type TypeEtablissement,
} from '@/api/etablissements';
import { Icon } from '@/ds/composants';
import { formaterMad, formaterNombre, formaterNote } from '@/lib/formats';
import { versInternational } from '@/lib/telephone';
import { useTitrePage } from '@/lib/titre';

const TYPES = Object.keys(LIBELLE_TYPE) as TypeEtablissement[];

/** Centre approximatif des douze villes du lancement, pour cadrer la carte. */
const CENTRE_VILLE: Record<string, [number, number]> = {
  casablanca: [33.5731, -7.5898],
  rabat: [34.0209, -6.8416],
  fes: [34.0331, -5.0003],
  marrakech: [31.6295, -7.9811],
  tanger: [35.7595, -5.834],
  kenitra: [34.261, -6.5802],
  agadir: [30.4278, -9.5981],
  meknes: [33.8935, -5.5473],
  mohammedia: [33.6866, -7.383],
  oujda: [34.6814, -1.9086],
  sale: [34.0531, -6.7985],
  tetouan: [35.5785, -5.3684],
};
const CENTRE_MAROC: [number, number] = [31.7, -7.09];

/**
 * Résultats de recherche — porté de la maquette « Site public écoles360 »
 * (écran résultats), livrable 11 §1, RG05 et RG19.
 *
 * LES FILTRES VIVENT DANS L'URL, pas dans un état local. C'est ce qui rend une
 * recherche partageable, indexable, et survivante au retour arrière du
 * navigateur. Les noms de paramètres sont ceux du contrat d'API — une
 * interface, pas un détail cosmétique.
 *
 * DEUX ÉCARTS ASSUMÉS avec la maquette, faute de support côté données : pas de
 * bascule « école sponsorisée » (RG19 les met déjà en tête, mais aucun
 * paramètre d'API ne filtre dessus) et pas de bouton « site web » sur les
 * cartes (le schéma ne porte pas cette donnée). Mieux vaut l'absence qu'un
 * bouton qui ne ferait rien.
 */
export function Resultats() {
  const [params, setParams] = useSearchParams();
  const [filtresOuverts, setFiltresOuverts] = useState(true);

  const filtres: FiltresRecherche = {
    q: params.get('q') ?? undefined,
    ville: params.get('ville') ?? undefined,
    type: (params.get('type')?.split(',').filter(Boolean) as TypeEtablissement[] | undefined),
    niveaux: params.get('niveaux')?.split(',').filter(Boolean),
    budget_min: params.get('budget_min') ? Number(params.get('budget_min')) : undefined,
    budget_max: params.get('budget_max') ? Number(params.get('budget_max')) : undefined,
    note_min: params.get('note_min') ? Number(params.get('note_min')) : undefined,
    tri: (params.get('tri') as FiltresRecherche['tri']) ?? undefined,
    page: params.get('page') ? Number(params.get('page')) : 1,
  };

  useTitrePage(
    filtres.q ? `« ${filtres.q} »` : 'Tous les établissements',
    "Comparez les établissements scolaires privés au Maroc par ville, type, note et budget.",
  );

  const villes = useQuery({ queryKey: ['villes'], queryFn: chargerVilles });
  const niveauxFilieres = useQuery({
    queryKey: ['niveaux-filieres'],
    queryFn: chargerNiveauxFilieres,
    // CHARGÉ SANS ATTENDRE LE TYPE. La capture du client montre les rangées
    // « Langues » et « Activités » dès l'arrivée sur la recherche : ce sont
    // les deux familles communes à tous les types, et les cacher priverait
    // d'un filtre utile celui qui n'a pas encore choisi. Le référentiel tient
    // en cinquante lignes, il se charge une fois pour la session.
    staleTime: 3_600_000,
  });
  const resultats = useQuery({
    queryKey: ['etablissements', filtres],
    queryFn: () => rechercherEtablissements(filtres),
  });

  const meta = resultats.data?.meta;
  /**
   * L'UNION DES FAMILLES DES TYPES COCHÉS, dans l'ordre de référence.
   *
   * Cocher « Crèche » et « Lycée » doit donner accès aux filtres des deux :
   * langues et activités pour la crèche, plus les filières pour le lycée.
   * Prendre l'intersection retirerait des filtres au fur et à mesure qu'on
   * élargit la recherche — exactement l'inverse de ce qu'on attend.
   *
   * Sans type coché, langues et activités : les deux familles communes à tous
   * les types, celles qu'on peut poser sans savoir ce qu'on cherche.
   */
  const famillesAffichees = (() => {
    if (!filtres.type?.length) return FAMILLES_PAR_DEFAUT;

    const ordre: CategorieCaracteristique[] = [
      'langue',
      'activite',
      'matiere',
      'filiere',
      'cursus',
      'domaine',
      'format',
    ];
    const retenues = new Set(filtres.type.flatMap((t) => FAMILLES_PAR_TYPE[t] ?? []));

    return ordre.filter((famille) => retenues.has(famille));
  })();

  // Chaque type et chaque caractéristique cochés comptent pour un : la
  // pastille annonce ce que le visiteur a posé, pas le nombre de familles
  // touchées. Quatre cycles cochés, c'est bien quatre filtres actifs.
  const nbFiltresActifs =
    [filtres.ville, filtres.budget_min, filtres.budget_max, filtres.note_min].filter(Boolean)
      .length +
    (filtres.type?.length ?? 0) +
    (filtres.niveaux?.length ?? 0);

  /**
   * Met un filtre à jour et RETOURNE EN PAGE 1 — sinon on atterrit hors bornes.
   *
   * PASSE PAR LA FORME FONCTIONNELLE de `setParams`, et ne lit jamais `params`
   * depuis la fermeture. Quatre puces cochées coup sur coup partaient sinon du
   * MÊME état figé au rendu : chaque clic écrasait le précédent, et seule la
   * dernière sélection survivait. C'est invisible au rythme d'un humain, mais
   * pas au rythme d'un double-clic — ni d'un test.
   */
  const majFiltre = (cle: string, valeur: string) => {
    setParams((precedents) => {
      const suivants = new URLSearchParams(precedents);
      if (valeur) suivants.set(cle, valeur);
      else suivants.delete(cle);
      suivants.delete('page');

      return suivants;
    });
  };

  /** Coche ou décoche une valeur dans un filtre à choix multiples. */
  const basculerListe = (cle: string, valeur: string) => {
    setParams((precedents) => {
      const suivants = new URLSearchParams(precedents);
      const actuels = (precedents.get(cle) ?? '').split(',').filter(Boolean);
      const liste = actuels.includes(valeur)
        ? actuels.filter((v) => v !== valeur)
        : [...actuels, valeur];

      if (liste.length > 0) suivants.set(cle, liste.join(','));
      else suivants.delete(cle);
      suivants.delete('page');

      return suivants;
    });
  };

  const basculerType = (type: TypeEtablissement) => basculerListe('type', type);

  const basculerNiveau = (id: string) => basculerListe('niveaux', id);

  const allerPage = (page: number) => {
    const suivants = new URLSearchParams(params);
    suivants.set('page', String(page));
    setParams(suivants);
    document.getElementById('resultats-haut')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Centre de la carte : la ville filtrée, sinon le Maroc entier.
  const villeCourante = villes.data?.find((v) => v.slug === filtres.ville);
  const [centreLat, centreLng] = filtres.ville
    ? (CENTRE_VILLE[filtres.ville] ?? CENTRE_MAROC)
    : CENTRE_MAROC;
  const zoom = filtres.ville && CENTRE_VILLE[filtres.ville] ? 12 : 5;
  const urlCarteEmbed = `https://maps.google.com/maps?ll=${centreLat},${centreLng}&z=${zoom}&hl=fr&output=embed`;
  const urlCarteExterne = `https://www.google.com/maps/search/?api=1&query=${centreLat},${centreLng}`;

  return (
    <div style={{ background: '#FAF8F4', minHeight: '60vh' }}>
      {/* Barre de filtres, collante sous l'en-tête */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #EAE6DE',
          position: 'sticky',
          top: 69,
          zIndex: 30,
          boxShadow: '0 4px 14px rgba(26,26,26,.04)',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setFiltresOuverts((v) => !v)} style={boutonFiltre}>
              <Icon name="layout-grid" size={17} color="#1D3557" />
              Filtres
              {nbFiltresActifs > 0 && (
                <span style={pastilleCompte}>{nbFiltresActifs}</span>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#FAF8F4', border: '1px solid #EAE6DE', borderRadius: 11, padding: '0 13px' }}>
              <Icon name="map-pin" size={16} color="#9AA3AF" />
              <select
                value={filtres.ville ?? ''}
                onChange={(e) => majFiltre('ville', e.target.value)}
                aria-label="Filtrer par ville"
                style={selecteurDiscret}
              >
                <option value="">Toutes les villes</option>
                {villes.data?.map((v) => (
                  <option key={v.id} value={v.slug}>
                    {v.nom}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAF8F4', border: '1px solid #EAE6DE', borderRadius: 11, padding: '5px 12px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: '#9AA3AF' }}>
                  Budget
                </span>
                <input
                  value={filtres.budget_min ?? ''}
                  onChange={(e) => majFiltre('budget_min', e.target.value)}
                  inputMode="numeric"
                  placeholder="Min"
                  aria-label="Budget minimum"
                  style={champBudget}
                />
                <span style={{ color: '#9AA3AF' }}>–</span>
                <input
                  value={filtres.budget_max ?? ''}
                  onChange={(e) => majFiltre('budget_max', e.target.value)}
                  inputMode="numeric"
                  placeholder="Max"
                  aria-label="Budget maximum"
                  style={champBudget}
                />
                <span style={{ fontSize: 12, color: '#9AA3AF', fontWeight: 600, whiteSpace: 'nowrap' }}>MAD/an</span>
              </div>

              <span style={{ fontSize: 13, color: '#9AA3AF', fontWeight: 500 }}>Trier :</span>
              <select
                value={filtres.tri ?? 'note'}
                onChange={(e) => majFiltre('tri', e.target.value)}
                aria-label="Trier les résultats"
                style={selecteurTri}
              >
                <option value="note">Mieux notés</option>
                <option value="recent">Plus récents</option>
                <option value="nom">Ordre alphabétique</option>
              </select>

              {(nbFiltresActifs > 0 || filtres.q) && (
                <button
                  type="button"
                  onClick={() => setParams(new URLSearchParams())}
                  style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#E63946', background: 'none', border: 'none', whiteSpace: 'nowrap' }}
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {filtresOuverts && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12, borderTop: '1px solid #EFECE6' }}>
              <GroupeChips libelle="Type">
                {TYPES.map((t) => (
                  <Puce
                    key={t}
                    actif={(filtres.type ?? []).includes(t)}
                    onClick={() => basculerType(t)}
                  >
                    {LIBELLE_TYPE[t]}
                  </Puce>
                ))}
              </GroupeChips>

              <GroupeChips libelle="Note">
                {[4, 3].map((n) => (
                  <Puce
                    key={n}
                    actif={filtres.note_min === n}
                    onClick={() => majFiltre('note_min', filtres.note_min === n ? '' : String(n))}
                  >
                    ★ {n} et plus
                  </Puce>
                ))}
              </GroupeChips>

              {/*
                UNE RANGÉE PAR FAMILLE, ET SEULEMENT CELLES QUI SERVENT AU TYPE
                CHOISI — c'est ce que fait la maquette (`TYPE_FILTER_KEYS`).
                Afficher les filières d'ingénierie à qui cherche une crèche
                noierait les deux filtres qui comptent pour lui.

                Le référentiel est chargé en entier une fois : il tient en
                cinquante lignes, et le découper par famille multiplierait les
                allers-retours sans rien gagner.
              */}
              {famillesAffichees.map((famille) => {
                const options = (niveauxFilieres.data ?? []).filter(
                  (n) => n.categorie === famille,
                );

                if (options.length === 0) return null;

                return (
                  <GroupeChips key={famille} libelle={LIBELLE_FAMILLE[famille]}>
                    {options.map((n) => (
                      <Puce
                        key={n.id}
                        actif={(filtres.niveaux ?? []).includes(n.id)}
                        onClick={() => basculerNiveau(n.id)}
                      >
                        {n.libelle}
                      </Puce>
                    ))}
                  </GroupeChips>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px 40px' }}>
        <h1 id="resultats-haut" style={{ margin: '0 0 18px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>
          {meta ? `${formaterNombre(meta.total)} établissement${meta.total > 1 ? 's' : ''}` : 'Recherche en cours…'}
        </h1>

        <div className="e3-reslayout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 400px', gap: 14, alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>
            {resultats.isPending && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[0, 1, 2].map((i) => (
                  <CarteSquelette key={i} />
                ))}
              </div>
            )}

            {resultats.isError && (
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#E63946' }}>
                La recherche a échoué. Rechargez la page.
              </p>
            )}

            {meta?.total === 0 && (
              <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16, padding: '64px 32px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: '50%', background: '#F1F3F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="search" size={28} color="#9AA3AF" />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 700 }}>Aucun établissement trouvé</h3>
                <p style={{ margin: '0 0 20px', fontSize: 14.5, color: '#5A6472' }}>
                  Essayez d&rsquo;élargir vos critères de recherche ou réinitialisez les filtres.
                </p>
                <button
                  type="button"
                  onClick={() => setParams(new URLSearchParams())}
                  style={{ border: 'none', background: '#E63946', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, padding: '11px 22px', borderRadius: 10, cursor: 'pointer' }}
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}

            {meta && meta.total > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {resultats.data?.data.map((fiche) => (
                  <CarteResultat key={fiche.id} fiche={fiche} />
                ))}
              </div>
            )}

            {meta && meta.total_pages > 1 && (
              <Pagination page={meta.page} totalPages={meta.total_pages} onAller={allerPage} />
            )}
          </div>

          {/* Carte — centrée sur la ville filtrée, sans clé Google Maps
              (intégration « output=embed », publique et sans quota). */}
          <div className="e3-mapcol" style={{ position: 'sticky', top: 210, height: 'calc(100vh - 232px)', minHeight: 460, borderRadius: 16, overflow: 'hidden', border: '1px solid #EAE6DE', display: 'flex', flexDirection: 'column', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderBottom: '1px solid #EAE6DE', flex: 'none' }}>
              <span style={{ width: 34, height: 34, borderRadius: 9, background: '#E7EDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name="map-pin" size={17} color="#1D3557" />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: '#9AA3AF' }}>
                  Carte
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {villeCourante?.nom ?? 'Maroc'}
                </div>
              </div>
              <a
                href={urlCarteExterne}
                target="_blank"
                rel="noopener noreferrer"
                title="Ouvrir dans Google Maps"
                style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #D4DAE2', background: '#fff', color: '#1D3557', fontSize: 12.5, fontWeight: 600, padding: '8px 12px', borderRadius: 9, textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Ouvrir
                <Icon name="external-link" size={13} color="#1D3557" />
              </a>
            </div>
            <iframe
              title="Carte des établissements"
              src={urlCarteEmbed}
              style={{ flex: 1, width: '100%', border: 0, display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Carte de résultat — reprend le markup de l'écran résultats de la maquette. */
function CarteResultat({ fiche }: { fiche: EtablissementListe }) {
  const budget =
    fiche.budget_min && fiche.budget_max
      ? `${formaterMad(fiche.budget_min)} – ${formaterMad(fiche.budget_max)}`
      : null;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderLeft: fiche.sponsorise ? '4px solid #E63946' : '1px solid #EAE6DE',
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
      }}
    >
      <Link
        to={`/etablissements/${fiche.slug}`}
        style={{
          width: 190,
          flex: 'none',
          background: fiche.photo ? `#E3E7EC url(${fiche.photo.chemin}) center/cover` : '#E3E7EC',
          position: 'relative',
          display: 'block',
        }}
        aria-hidden={!fiche.photo}
        tabIndex={-1}
      >
        {fiche.sponsorise && (
          <span style={{ position: 'absolute', top: 10, left: 10, background: '#E63946', color: '#fff', fontSize: 10.5, fontWeight: 700, letterSpacing: '.3px', padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
            Sponsorisé
          </span>
        )}
      </Link>

      <div style={{ flex: 1, minWidth: 0, padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ background: '#F1F3F6', color: '#5A6472', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>
            {LIBELLE_TYPE[fiche.type]}
          </span>
          {/*
            « Groupe : Crèche → Lycée » — l'information qui décide un parent
            devant une liste : cette enseigne couvre-t-elle toute la scolarité
            de mes enfants ? Sans elle, deux fiches du même groupe ressemblent
            à un doublon.
          */}
          {fiche.groupe && (
            <span
              title={fiche.groupe.nom}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#E7EDF5', color: '#1D3557', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}
            >
              <Icon name="building" size={11} color="#1D3557" />
              Groupe : {LIBELLE_TYPE[fiche.groupe.premier]} → {LIBELLE_TYPE[fiche.groupe.dernier]}
            </span>
          )}
          {fiche.verifie && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#E6F4EC', color: '#1F7A44', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
              <Icon name="check" size={11} color="#1F7A44" /> Vérifié
            </span>
          )}
        </div>

        <Link to={`/etablissements/${fiche.slug}`} style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px', color: '#1A1A1A', textDecoration: 'none' }}>
          {fiche.nom}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#5A6472', fontSize: 13, marginTop: 4 }}>
          <Icon name="map-pin" size={12} color="#9AA3AF" />
          {fiche.quartier ? `${fiche.quartier} — ` : ''}
          {fiche.ville.nom}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13.5 }}>
            <span style={{ color: '#E9A23B', fontWeight: 700 }}>★ {formaterNote(fiche.note_moy)}</span>
            <span style={{ color: '#9AA3AF' }}>· {formaterNombre(fiche.nb_avis)} avis</span>
          </span>
          {budget && (
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1D3557', background: '#F1F3F6', borderRadius: 8, padding: '4px 10px' }}>
              {budget}/an
            </span>
          )}
        </div>

        {/*
          LE NUMÉRO EST ÉCRIT EN TOUTES LETTRES, pas caché derrière « Appeler ».
          C'est ce que fait la maquette, et c'est ce qui sert : sur ordinateur,
          un bouton `tel:` ne déclenche rien, alors qu'un numéro lisible se
          recopie. L'appel est tracé (RG10) dans les deux cas.
        */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 12, flexWrap: 'wrap' }}>
          {fiche.tel && (
            <a
              href={`tel:+${versInternational(fiche.tel)}`}
              onClick={() => tracerEvenement(fiche.slug, 'appel', 'resultats')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#1D3557', color: '#fff', fontSize: 13, fontWeight: 700, padding: '9px 13px', borderRadius: 9, whiteSpace: 'nowrap' }}
            >
              <Icon name="phone" size={14} color="#fff" />
              {fiche.tel}
            </a>
          )}

          {(fiche.whatsapp ?? fiche.tel) && (
            <a
              href={`https://wa.me/${versInternational(fiche.whatsapp ?? fiche.tel!)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => tracerEvenement(fiche.slug, 'whatsapp', 'resultats')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#2E9E5B', color: '#fff', fontSize: 13, fontWeight: 700, padding: '9px 13px', borderRadius: 9, whiteSpace: 'nowrap' }}
            >
              <Icon name="message-circle" size={14} color="#fff" />
              WhatsApp
            </a>
          )}

          {fiche.site_web && (
            <a
              href={fiche.site_web}
              target="_blank"
              rel="noreferrer"
              title="Site web de l’établissement"
              aria-label={`Site web de ${fiche.nom}`}
              style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #D4DAE2', background: '#fff', padding: '9px 12px', borderRadius: 9 }}
            >
              <Icon name="globe" size={15} color="#5A6472" />
            </a>
          )}

          {/*
            Pas de trace de vue au clic : la fiche la pose à son ouverture, par
            quelque chemin qu'on y arrive (B-41). La poser ici aussi comptait
            deux vues pour une consultation, et aucune pour l'image ou le nom.
          */}
          <Link
            to={`/etablissements/${fiche.slug}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #D4DAE2', background: '#fff', color: '#1D3557', fontSize: 13, fontWeight: 700, padding: '9px 13px', borderRadius: 9, whiteSpace: 'nowrap' }}
          >
            Voir la fiche
          </Link>
          {fiche.lat && fiche.lng && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${fiche.lat},${fiche.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Localiser sur la carte"
              style={{ border: '1px solid #D4DAE2', background: '#fff', color: '#5A6472', fontSize: 12.5, fontWeight: 600, padding: '9px 12px', borderRadius: 9, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <Icon name="map-pin" size={14} color="#5A6472" />
              Carte
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function CarteSquelette() {
  return (
    <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 14, overflow: 'hidden', display: 'flex' }}>
      <div style={{ width: 190, flex: 'none', height: 168, background: '#F1F3F6' }} />
      <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 120, height: 14, borderRadius: 6, background: '#F1F3F6' }} />
        <div style={{ width: '60%', height: 20, borderRadius: 6, background: '#F1F3F6' }} />
        <div style={{ width: '45%', height: 13, borderRadius: 6, background: '#F1F3F6' }} />
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onAller }: { page: number; totalPages: number; onAller: (p: number) => void }) {
  // Fenêtre de pages centrée sur la page courante — jamais plus de 5 boutons
  // numérotés, sinon la maquette déborde sur les recherches à 400 pages.
  const debut = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => debut + i).filter(
    (p) => p >= 1 && p <= totalPages,
  );

  return (
    <nav aria-label="Pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 32 }}>
      <BoutonPage onClick={() => onAller(page - 1)} desactive={page <= 1} aria-label="Page précédente">
        <Icon name="chevron-left" size={16} />
      </BoutonPage>
      {pages.map((p) => (
        <BoutonPage key={p} onClick={() => onAller(p)} actif={p === page}>
          {p}
        </BoutonPage>
      ))}
      <BoutonPage onClick={() => onAller(page + 1)} desactive={page >= totalPages} aria-label="Page suivante">
        <Icon name="chevron-right" size={16} />
      </BoutonPage>
    </nav>
  );
}

function BoutonPage({
  children,
  onClick,
  actif,
  desactive,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  actif?: boolean;
  desactive?: boolean;
} & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactive}
      {...rest}
      style={{
        minWidth: 38,
        height: 38,
        padding: '0 10px',
        borderRadius: 9,
        border: `1px solid ${actif ? '#1D3557' : '#EAE6DE'}`,
        background: actif ? '#1D3557' : '#fff',
        color: desactive ? '#B7C0CD' : actif ? '#fff' : '#5A6472',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: desactive ? 'default' : 'pointer',
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}

function GroupeChips({ libelle, children }: { libelle: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ flex: 'none', minWidth: 82, fontSize: 11, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: '#9AA3AF' }}>
        {libelle}
      </span>
      {children}
    </div>
  );
}

function Puce({ children, actif, onClick }: { children: React.ReactNode; actif: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      style={{
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        padding: '6px 13px',
        borderRadius: 20,
        background: actif ? '#FDE8EA' : '#fff',
        border: `1px solid ${actif ? '#E63946' : '#EAE6DE'}`,
        color: actif ? '#C42B38' : '#5A6472',
      }}
    >
      {children}
    </button>
  );
}

const boutonFiltre: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
  border: '1px solid #D4DAE2',
  background: '#fff',
  color: '#1A1A1A',
  fontFamily: 'inherit',
  fontSize: 14,
  fontWeight: 600,
  padding: '11px 16px',
  borderRadius: 11,
  cursor: 'pointer',
};

const pastilleCompte: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 20,
  height: 20,
  padding: '0 6px',
  borderRadius: 20,
  background: '#E63946',
  color: '#fff',
  fontSize: 11.5,
  fontWeight: 700,
};

const selecteurDiscret: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: 14,
  padding: '11px 4px 11px 0',
  cursor: 'pointer',
  color: '#1A1A1A',
  fontWeight: 600,
};

const selecteurTri: React.CSSProperties = {
  border: '1px solid #EAE6DE',
  background: '#fff',
  borderRadius: 10,
  fontFamily: 'inherit',
  fontSize: 13.5,
  fontWeight: 600,
  padding: '10px 14px',
  cursor: 'pointer',
  color: '#1A1A1A',
};

const champBudget: React.CSSProperties = {
  width: 56,
  background: '#fff',
  border: '1px solid #E1E5EA',
  borderRadius: 8,
  fontFamily: 'inherit',
  fontSize: 13.5,
  padding: '7px 9px',
  color: '#1A1A1A',
};
