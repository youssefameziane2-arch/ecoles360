import { useState } from 'react';
import type { FicheEspace } from '@/api/espace';
import { LIBELLE_TYPE } from '@/api/etablissements';
import { Badge, Icon, Tabs } from '@/ds/composants';
import { formaterMad, formaterNombre, formaterNote, rangJour } from '@/lib/formats';

/**
 * Aperçu de la page profil — écran `isFichePage` de la maquette.
 *
 * C'EST LA PAGE PUBLIQUE, RENDUE DANS L'ESPACE. L'établissement ne remplit pas
 * un formulaire en imaginant le résultat : il voit sa page telle qu'un parent
 * la voit, et clique « Modifier » dessus. C'est la différence entre éditer une
 * base de données et éditer une page.
 *
 * DEUX BLOCS DE LA MAQUETTE RESTENT ABSENTS, faute de modèle de données :
 * l'encart « Établissement multi-cycles » (aucune relation de groupe entre
 * fiches) et l'onglet « Équipe » (aucune table). Les signaler vaut mieux que
 * les remplir de valeurs inventées.
 */

const ONGLETS = [
  { key: 'apropos', label: 'À propos' },
  { key: 'filieres', label: 'Filières' },
  { key: 'equipements', label: 'Équipements' },
  { key: 'tarifs', label: 'Tarifs' },
  { key: 'avis', label: 'Avis' },
];

const LIBELLE_RESEAU: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  x: 'X',
};

export function ApercuFiche({ fiche }: { fiche: FicheEspace }) {
  const [onglet, setOnglet] = useState('apropos');
  const [photo, setPhoto] = useState(0);

  const photos = fiche.photos ?? [];
  const photoCourante = photos[photo];

  return (
    <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 22px',
          background: '#FBFAF7',
          borderBottom: '1px solid #EAE6DE',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: '#9AA3AF' }}>
          Page profil — site public
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: fiche.statut === 'validee' ? '#1F7A45' : '#B57708' }}>
          {fiche.statut === 'validee' ? 'Version actuellement en ligne' : 'Non publiée'}
        </span>
      </div>

      <div style={{ padding: '20px 26px 0' }}>
        {/* Fil d'Ariane — celui du site public */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#9AA3AF', marginBottom: 14, flexWrap: 'wrap' }}>
          <span>Accueil</span>
          <span>›</span>
          <span>Établissements</span>
          <span>›</span>
          <span style={{ color: '#5A6472', fontWeight: 500 }}>{fiche.nom}</span>
        </div>

        {/* Galerie */}
        <div style={{ position: 'relative', height: 290, borderRadius: 16, overflow: 'hidden', background: '#E3E7EC' }}>
          {photoCourante && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${photoCourante.chemin})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.16))' }} />

          {photos.length > 1 && (
            <>
              <BoutonGalerie cote="left" onClick={() => setPhoto((photos.length + photo - 1) % photos.length)} />
              <BoutonGalerie cote="right" onClick={() => setPhoto((photo + 1) % photos.length)} />
            </>
          )}

          <div
            style={{
              position: 'absolute',
              left: 18,
              bottom: 16,
              background: 'rgba(0,0,0,.55)',
              color: '#fff',
              fontSize: 12.5,
              fontWeight: 500,
              padding: '6px 13px',
              borderRadius: 8,
            }}
          >
            {photoCourante?.alt ?? 'Aucune photo — ajoutez-en une depuis « Modifier »'}
          </div>

          {photos.length > 1 && (
            <div style={{ position: 'absolute', right: 18, bottom: 18, display: 'flex', gap: 6 }}>
              {photos.map((p, index) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPhoto(index)}
                  aria-label={`Photo ${index + 1}`}
                  style={{
                    cursor: 'pointer',
                    height: 7,
                    width: index === photo ? 22 : 7,
                    borderRadius: 8,
                    border: 'none',
                    background: index === photo ? '#fff' : 'rgba(255,255,255,.5)',
                    transition: 'all .3s ease',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="e-apercu">
        {/* ---- Colonne principale ------------------------------------- */}
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1.15 }}>
            {fiche.nom}
          </h2>

          <div style={{ marginTop: 22 }}>
            <Tabs tabs={ONGLETS} value={onglet} onChange={setOnglet} />
          </div>

          <div style={{ padding: '22px 0 0' }}>
            {onglet === 'apropos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <Bloc titre="Notre histoire">
                  <Paragraphe valeur={fiche.description} vide="Aucune présentation renseignée" />
                </Bloc>

                <Bloc titre="Projet pédagogique">
                  <Paragraphe valeur={fiche.projet_pedagogique} vide="Aucun projet pédagogique renseigné" />
                </Bloc>

                {fiche.chiffres && fiche.chiffres.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 18 }}>
                    {fiche.chiffres.map((chiffre) => (
                      <div key={chiffre.label}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#1D3557', letterSpacing: '-0.8px' }}>
                          {chiffre.valeur}
                        </div>
                        <div style={{ fontSize: 13, color: '#5A6472', marginTop: 4 }}>{chiffre.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <Bloc titre="Vidéo de présentation">
                  {fiche.video_url ? (
                    <a href={fiche.video_url} target="_blank" rel="noopener noreferrer" style={lienStyle}>
                      {fiche.video_url}
                    </a>
                  ) : (
                    <Paragraphe valeur={null} vide="Aucun lien vidéo renseigné" />
                  )}
                </Bloc>

                {fiche.faq && fiche.faq.length > 0 && (
                  <Bloc titre="Questions fréquentes">
                    {fiche.faq.map((item) => (
                      <details key={item.q} style={{ borderBottom: '1px solid #F1ECE3', padding: '12px 0' }}>
                        <summary style={{ fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>{item.q}</summary>
                        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.6, color: '#5A6472' }}>{item.r}</p>
                      </details>
                    ))}
                  </Bloc>
                )}
              </div>
            )}

            {onglet === 'filieres' && (
              <Puces
                valeurs={fiche.niveaux.map((lien) => lien.niveau.libelle)}
                vide="Aucun niveau ni filière renseigné"
              />
            )}

            {onglet === 'equipements' && (
              <Puces valeurs={fiche.facilites ?? []} vide="Aucun équipement renseigné" />
            )}

            {onglet === 'tarifs' && (
              <div>
                {fiche.budget_min && fiche.budget_max ? (
                  <>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#1D3557', letterSpacing: '-0.8px' }}>
                      {formaterMad(fiche.budget_min)} – {formaterMad(fiche.budget_max)}
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: 14, color: '#5A6472' }}>
                      Budget annuel indicatif{fiche.gamme_label ? ` · ${fiche.gamme_label}` : ''}
                    </p>
                  </>
                ) : (
                  <Paragraphe valeur={null} vide="Aucun budget renseigné" />
                )}
                {fiche.devis_label && (
                  <p style={{ margin: '10px 0 0', fontSize: 13.5, color: '#9AA3AF' }}>{fiche.devis_label}</p>
                )}
              </div>
            )}

            {onglet === 'avis' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#E9A23B', fontSize: 22, fontWeight: 700 }}>
                    ★ {formaterNote(fiche.note_moy)}
                  </span>
                  <span style={{ color: '#9AA3AF', fontSize: 14 }}>
                    ({formaterNombre(fiche.nb_avis)} avis)
                  </span>
                </div>
                <p style={{ margin: '10px 0 0', fontSize: 14, color: '#5A6472', lineHeight: 1.6 }}>
                  Les avis et vos réponses se gèrent depuis la page « Avis reçus ».
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ---- Colonne de droite --------------------------------------- */}
        <aside style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={encadre}>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
              {fiche.sponsorise && <Badge tone="red">Sponsorisé</Badge>}
              {fiche.verifie && <Badge tone="green">✓ Vérifié</Badge>}
              <Badge tone="grey">{LIBELLE_TYPE[fiche.type]}</Badge>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ color: '#E9A23B', fontSize: 19, fontWeight: 800 }}>
                ★ {formaterNote(fiche.note_moy)}
              </span>
              <span style={{ color: '#9AA3AF', fontSize: 13 }}>
                ({formaterNombre(fiche.nb_avis)} avis)
              </span>
              {fiche.premium && (
                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#B57708' }}>
                  ••• Premium
                </span>
              )}
            </div>

            <Specification
              intitule="Budget"
              valeur={
                fiche.budget_min && fiche.budget_max
                  ? `${formaterMad(fiche.budget_min)} – ${formaterMad(fiche.budget_max)} / an`
                  : null
              }
            />
            <Specification intitule="Langues" valeur={fiche.langues} />
            <Specification
              intitule="Localité"
              valeur={fiche.quartier ? `${fiche.quartier}, ${fiche.ville.nom}` : fiche.ville.nom}
            />
          </div>

          <div style={encadre}>
            <TitreEncadre>Coordonnées</TitreEncadre>
            <LigneContact icone="map-pin" valeur={fiche.adresse ?? fiche.ville.nom} />
            <LigneContact icone="phone" valeur={fiche.tel} lien={fiche.tel ? `tel:${fiche.tel.replace(/\s/g, '')}` : undefined} />
            <LigneContact icone="message-circle" valeur={fiche.whatsapp} />
            <LigneContact icone="mail" valeur={fiche.email} lien={fiche.email ? `mailto:${fiche.email}` : undefined} />
            <LigneContact icone="globe" valeur={fiche.site_web} lien={fiche.site_web ?? undefined} />

            {fiche.lat && fiche.lng && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${fiche.lat},${fiche.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...lienStyle, display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 10 }}
              >
                <Icon name="external-link" size={14} color="#1D3557" />
                Voir sur Google Maps
              </a>
            )}
          </div>

          {fiche.horaires && Object.keys(fiche.horaires).length > 0 && (
            <div style={encadre}>
              <TitreEncadre>Horaires</TitreEncadre>
              {Object.entries(fiche.horaires)
                .sort(([a], [b]) => rangJour(a) - rangJour(b))
                .map(([jour, plage]) => (
                <div
                  key={jour}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '7px 0',
                    borderBottom: '1px solid #F7F4EE',
                    fontSize: 13.5,
                  }}
                >
                  <span style={{ color: '#5A6472' }}>{jour}</span>
                  <span style={{ fontWeight: 600 }}>{plage}</span>
                </div>
              ))}
            </div>
          )}

          {fiche.socials && Object.keys(fiche.socials).length > 0 && (
            <div style={encadre}>
              <TitreEncadre>Réseaux sociaux</TitreEncadre>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(fiche.socials).map(([reseau, url]) => (
                  <a key={reseau} href={url} target="_blank" rel="noopener noreferrer" style={lienStyle}>
                    {LIBELLE_RESEAU[reseau] ?? reseau}
                  </a>
                ))}
              </div>
            </div>
          )}

          {fiche.autres_projets && fiche.autres_projets.length > 0 && (
            <div style={encadre}>
              <TitreEncadre>Autres projets du propriétaire</TitreEncadre>
              <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#9AA3AF', lineHeight: 1.5 }}>
                Le même propriétaire gère d’autres enseignes.
              </p>
              {fiche.autres_projets.map((projet) => (
                <div key={projet.nom} style={{ padding: '10px 0', borderBottom: '1px solid #F7F4EE' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: '#9AA3AF' }}>
                    {projet.type}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3 }}>{projet.nom}</div>
                  {projet.ville && (
                    <div style={{ fontSize: 12.5, color: '#9AA3AF', marginTop: 2 }}>{projet.ville}</div>
                  )}
                  {projet.description && (
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#5A6472', lineHeight: 1.55 }}>
                      {projet.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function BoutonGalerie({ cote, onClick }: { cote: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={cote === 'left' ? 'Photo précédente' : 'Photo suivante'}
      style={{
        position: 'absolute',
        [cote]: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'rgba(255,255,255,.92)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(0,0,0,.15)',
      }}
    >
      <Icon name={cote === 'left' ? 'chevron-left' : 'chevron-right'} size={19} color="#1A1A1A" />
    </button>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700 }}>{titre}</h3>
      {children}
    </div>
  );
}

/** Un champ vide se dit, il ne se cache pas — la maquette affiche l'absence. */
function Paragraphe({ valeur, vide }: { valeur: string | null | undefined; vide: string }) {
  if (!valeur) {
    return <p style={{ margin: 0, fontSize: 14, color: '#9AA3AF', fontStyle: 'italic' }}>{vide}</p>;
  }

  return <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#3A424E' }}>{valeur}</p>;
}

function Puces({ valeurs, vide }: { valeurs: string[]; vide: string }) {
  if (valeurs.length === 0) {
    return <Paragraphe valeur={null} vide={vide} />;
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {valeurs.map((valeur) => (
        <span
          key={valeur}
          style={{
            background: '#F1F3F6',
            color: '#2A313B',
            fontSize: 13,
            fontWeight: 600,
            padding: '7px 13px',
            borderRadius: 20,
          }}
        >
          {valeur}
        </span>
      ))}
    </div>
  );
}

function Specification({ intitule, valeur }: { intitule: string; valeur: string | null | undefined }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid #F7F4EE' }}>
      <span style={{ fontSize: 13, color: '#9AA3AF' }}>{intitule}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, textAlign: 'right' }}>
        {valeur ?? <span style={{ color: '#C9CFD8', fontWeight: 400 }}>Non renseigné</span>}
      </span>
    </div>
  );
}

function LigneContact({
  icone,
  valeur,
  lien,
}: {
  icone: string;
  valeur: string | null | undefined;
  lien?: string;
}) {
  if (!valeur) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', fontSize: 13.5 }}>
      <Icon name={icone} size={15} color="#9AA3AF" />
      {lien ? (
        <a href={lien} target="_blank" rel="noopener noreferrer" style={lienStyle}>
          {valeur}
        </a>
      ) : (
        <span>{valeur}</span>
      )}
    </div>
  );
}

function TitreEncadre({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '.6px',
        textTransform: 'uppercase',
        color: '#9AA3AF',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

const encadre: React.CSSProperties = {
  background: '#FBFAF7',
  border: '1px solid #EAE6DE',
  borderRadius: 14,
  padding: '16px 18px',
};

const lienStyle: React.CSSProperties = {
  color: '#1D3557',
  fontWeight: 600,
  textDecoration: 'none',
  fontSize: 13.5,
  wordBreak: 'break-word',
};
