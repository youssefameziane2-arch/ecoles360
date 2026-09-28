import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  LIBELLE_TYPE,
  chargerAvis,
  chargerEtablissement,
  chargerSimilaires,
  deposerAvis,
  envoyerDemandeContact,
  signalerAvis,
  tracerEvenement,
  type AvisPublic,
  type EtablissementDetail,
  type TypeEtablissement,
} from '@/api/etablissements';
import { chargerArticles, chargerArticlesEtablissement } from '@/api/articles';
import { CarteBlog } from './Blog';
import { AlerteErreur, BoutonPrimaire, Champ, ChoixNote, ZoneTexte } from '@/components/Champs';
import { Icon, ReviewCard, Tabs, TeamMember } from '@/ds/composants';
import { formaterDepuis, formaterMad, formaterNombre, formaterNote, rangJour } from '@/lib/formats';
import { lienTelephone, lienWhatsApp } from '@/lib/telephone';
import { useTitrePage } from '@/lib/titre';

/**
 * Cadence du défilement — cinq secondes.
 *
 * La maquette tourne à trois secondes sur le héros. Le client a demandé cinq,
 * ici comme sur l'accueil, et il a raison : trois secondes suffisent à peine à
 * regarder une photo de salle de classe, et le mouvement finit par agacer plus
 * qu'il n'informe.
 */
const CADENCE_GALERIE_MS = 5000;

/**
 * Fiche établissement — livrable 12 §5.
 *
 * LE FORMULAIRE DE CONTACT EST LE CŒUR DU PRODUIT : c'est lui qui transforme
 * un visiteur en lead pour l'établissement (RG09, RG21). Trois choses le
 * gouvernent — le bouton reste inactif sans consentement, une double
 * soumission est impossible, et les erreurs 422 sont re-projetées champ par
 * champ (livrable 13 §3).
 */
export function Fiche() {
  const { slug = '' } = useParams();
  const queryClient = useQueryClient();

  const fiche = useQuery({
    queryKey: ['etablissement', slug],
    queryFn: () => chargerEtablissement(slug),
    enabled: Boolean(slug),
  });

  const avis = useQuery({
    queryKey: ['avis', slug],
    queryFn: () => chargerAvis(slug),
    enabled: Boolean(slug),
  });

  const e = fiche.data;

  useTitrePage(
    e ? `${e.nom} — ${LIBELLE_TYPE[e.type]} à ${e.ville.nom}` : null,
    e?.description ?? undefined,
  );

  // Vue de page profil — c'est elle qui alimentera la facturation à la vue
  // (RG12). Tracée une seule fois par montage, pas à chaque rendu.
  useEffect(() => {
    if (fiche.isSuccess && slug) {
      tracerEvenement(slug, 'vue', 'fiche');
    }
  }, [fiche.isSuccess, slug]);

  if (fiche.isPending) {
    return <div className="conteneur section">Chargement…</div>;
  }

  if (fiche.isError || !e) {
    const introuvable = fiche.error instanceof ApiError && fiche.error.statut === 404;

    return (
      <div className="conteneur section" style={{ textAlign: 'center', padding: '80px 0' }}>
        <h1 className="titre-section">
          {introuvable ? 'Établissement introuvable' : 'Une erreur est survenue'}
        </h1>
        <p className="sous-titre-section">
          {introuvable
            ? "Cette fiche n'existe pas ou n'est pas encore publiée."
            : 'Rechargez la page ; si le problème persiste, réessayez plus tard.'}
        </p>
        <Link
          to="/etablissements"
          style={{
            font: "600 14px/1 'Inter', sans-serif",
            color: '#fff',
            background: '#E63946',
            borderRadius: 10,
            padding: '12px 20px',
            display: 'inline-block',
          }}
        >
          Voir tous les établissements
        </Link>
      </div>
    );
  }

  return (
    <div className="conteneur section">
      {/* La galerie ouvre la page, comme dans la maquette : ce qu'un parent
          regarde en premier, c'est à quoi ressemble l'école. */}
      <GalerieFiche photos={e.photos} nom={e.nom} />

      {/*
        DEUX COLONNES DÈS LE TITRE, comme la maquette. La carte d'identité —
        badges, note, budget, langues, localité — se lit en même temps que le
        nom, pas trois écrans plus bas. C'est elle qui répond aux questions
        qu'un parent se pose avant même de lire la description.
      */}
      <div className="e3-fiche">
        <div style={{ minWidth: 0 }}>
          <h1 style={{ font: "800 34px/1.15 'Inter', sans-serif", letterSpacing: '-0.9px', margin: '0 0 6px' }}>
            {e.nom}
          </h1>
          <p style={{ font: "400 15px/1.6 'Inter', sans-serif", color: '#5A6472', margin: '0 0 20px' }}>
            {e.adresse ? `${e.adresse} — ` : ''}
            {e.ville.nom}
          </p>

          <BandeauCycles etablissement={e} />

          <OngletsFiche etablissement={e} />

          <VideoPresentation etablissement={e} />

          <Bloc titre={`Avis des parents (${formaterNombre(e.nb_avis)})`}>
            {avis.data?.data.length === 0 && (
              <p style={{ font: "400 14px/1.6 'Inter', sans-serif", color: '#5A6472', margin: '0 0 16px' }}>
                Aucun avis publié pour le moment. Soyez le premier à partager votre expérience.
              </p>
            )}

            {avis.data?.data.map((a) => (
              <CarteAvis key={a.id} avis={a} />
            ))}

            <FormulaireAvis slug={slug} />
          </Bloc>
        </div>

        <aside className="e3-fiche-aside">
          <CarteIdentite etablissement={e} />

          <BlocLateral titre="Coordonnées">
            <LigneContact icone="map-pin" valeur={`${e.quartier ? `${e.quartier}, ` : ''}${e.ville.nom}`} />
            {e.tel && (
              <LigneContact
                icone="phone"
                valeur={
                  <a
                    href={lienTelephone(e.tel)}
                    onClick={() => tracerEvenement(slug, 'appel', 'fiche')}
                    style={{ color: '#1A1A1A', fontWeight: 600 }}
                  >
                    {e.tel}
                  </a>
                }
              />
            )}
            {e.email && <LigneContact icone="mail" valeur={e.email} />}
            {e.site_web && (
              <LigneContact
                icone="globe"
                valeur={
                  <a href={e.site_web} target="_blank" rel="noreferrer" style={{ color: '#1D3557', fontWeight: 600 }}>
                    Site web
                  </a>
                }
              />
            )}
          </BlocLateral>

          {e.horaires && Object.keys(e.horaires).length > 0 && (
            <BlocLateral titre="Horaires">
              {Object.entries(e.horaires)
                .sort(([a], [b]) => rangJour(a) - rangJour(b))
                .map(([jour, plage]) => (
                  <LigneInfo key={jour} intitule={jour} valeur={plage} />
                ))}
            </BlocLateral>
          )}

          {/* Les deux gestes que la maquette met en gros, l'un sous l'autre. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {e.tel && (
              <a
                href={lienTelephone(e.tel)}
                onClick={() => tracerEvenement(slug, 'appel', 'fiche')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#1D3557',
                  color: '#fff',
                  borderRadius: 12,
                  padding: '14px 18px',
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: 'rgba(255,255,255,.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  <Icon name="phone" size={16} color="#fff" />
                </span>
                <span>
                  <span
                    style={{
                      display: 'block',
                      font: "700 10.5px/1.3 'Inter', sans-serif",
                      letterSpacing: '.8px',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,.66)',
                    }}
                  >
                    Appeler l&rsquo;établissement
                  </span>
                  <span style={{ display: 'block', font: "800 16px/1.3 'Inter', sans-serif" }}>
                    {e.tel}
                  </span>
                </span>
              </a>
            )}

            {(e.whatsapp ?? e.tel) && (
              <a
                href={lienWhatsApp(e.whatsapp ?? e.tel!)}
                target="_blank"
                rel="noreferrer"
                onClick={() => tracerEvenement(slug, 'whatsapp', 'fiche')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  background: '#2E9E5B',
                  color: '#fff',
                  borderRadius: 12,
                  padding: '14px 18px',
                  font: "600 15px/1 'Inter', sans-serif",
                  boxShadow: '0 6px 16px rgba(46,158,91,.22)',
                }}
              >
                <Icon name="message-circle" size={17} color="#fff" />
                Contacter sur WhatsApp
              </a>
            )}
          </div>

          <SituationCarte etablissement={e} />

          {e.socials && Object.keys(e.socials).length > 0 && (
            <BlocLateral titre="Réseaux sociaux">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(e.socials).map(([reseau, url]) => (
                  <a
                    key={reseau}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      font: "600 12.5px/1 'Inter', sans-serif",
                      color: '#1D3557',
                      background: '#F1F3F6',
                      borderRadius: 20,
                      padding: '8px 13px',
                      textTransform: 'capitalize',
                    }}
                  >
                    {reseau}
                  </a>
                ))}
              </div>
            </BlocLateral>
          )}

          <div style={{ marginTop: 16 }}>
            <FormulaireContact
              slug={slug}
              onEnvoye={() => void queryClient.invalidateQueries({ queryKey: ['etablissement', slug] })}
            />
          </div>
        </aside>
      </div>

      <AutresProjets etablissement={e} />
      <ArticlesFiche slug={slug} nom={e.nom} />
      <EtablissementsSimilaires slug={slug} type={e.type} />
    </div>
  );
}

/**
 * Onglets de contenu — reprend le composant `Tabs` du design system, comme la
 * maquette (écran fiche). Un onglet n'apparaît que si la fiche porte la
 * donnée correspondante : « Équipe » et le bandeau multi-cycles de la
 * maquette n'ont aucun champ dans le schéma (RG02) et restent donc absents,
 * plutôt que d'afficher un onglet vide.
 */
function OngletsFiche({ etablissement: e }: { etablissement: EtablissementDetail }) {
  const onglets = useMemo(
    () =>
      [
        (Boolean(e.description) || (e.chiffres?.length ?? 0) > 0) && {
          key: 'apropos',
          label: 'À propos',
        },
        e.niveaux.length > 0 && {
          key: 'niveaux',
          label: 'Niveaux & filières',
          count: e.niveaux.length,
        },
        (e.facilites?.length ?? 0) > 0 && { key: 'equipements', label: 'Équipements' },
        (e.equipe?.length ?? 0) > 0 && {
          key: 'equipe',
          label: 'Équipe',
          count: e.equipe?.length,
        },
        e.budget_min && e.budget_max && { key: 'tarifs', label: 'Tarifs' },
        (e.faq?.length ?? 0) > 0 && { key: 'faq', label: 'FAQ', count: e.faq?.length },
      ].filter((onglet): onglet is { key: string; label: string; count?: number } => Boolean(onglet)),
    [e],
  );

  const [actif, setActif] = useState(onglets[0]?.key);

  if (onglets.length === 0) {
    return null;
  }

  const courant = actif ?? onglets[0]?.key;

  return (
    <div style={{ marginBottom: 24 }}>
      <Tabs tabs={onglets} value={courant} onChange={setActif} style={{ marginBottom: 22 }} />

      {courant === 'apropos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {e.description && (
            <div>
              <h3 style={{ margin: '0 0 10px', font: "700 18px/1.3 'Inter', sans-serif" }}>
                Notre histoire
              </h3>
              <p style={{ font: "400 15px/1.7 'Inter', sans-serif", color: '#3A424E', margin: 0 }}>
                {e.description}
              </p>
            </div>
          )}
          {e.projet_pedagogique && (
            <div>
              <h3 style={{ margin: '0 0 10px', font: "700 18px/1.3 'Inter', sans-serif" }}>
                Projet pédagogique
              </h3>
              <p style={{ font: "400 15px/1.7 'Inter', sans-serif", color: '#3A424E', margin: 0 }}>
                {e.projet_pedagogique}
              </p>
            </div>
          )}
          {e.chiffres && e.chiffres.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
              {e.chiffres.map((c) => (
                <div key={c.label}>
                  <p style={{ font: "800 30px/1 'Inter', sans-serif", color: '#1D3557', margin: '0 0 4px' }}>
                    {c.valeur}
                  </p>
                  <p style={{ font: "400 13px/1.4 'Inter', sans-serif", color: '#5A6472', margin: 0 }}>
                    {c.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {courant === 'niveaux' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {e.niveaux.map((n) => (
            <Puce key={n.id} texte={n.libelle} fond="#F1F3F6" couleur="#2A313B" />
          ))}
        </div>
      )}

      {courant === 'equipements' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {e.facilites?.map((f) => <Puce key={f} texte={f} fond="#F1F3F6" couleur="#2A313B" />)}
        </div>
      )}

      {/*
        L'ÉQUIPE EST UNE PREUVE, PAS UNE DÉCORATION. Un parent qui hésite entre
        deux écoles veut savoir à qui il confiera son enfant ; des noms et des
        fonctions valent plus qu'une page de promesses. C'est aussi pourquoi
        l'onglet n'apparaît pas quand l'établissement n'a rien renseigné :
        une section vide dirait le contraire de ce qu'elle cherche à dire.
      */}
      {courant === 'equipe' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 12,
          }}
        >
          {e.equipe?.map((membre) => (
            <TeamMember
              key={`${membre.nom}-${membre.role}`}
              name={membre.nom}
              role={membre.role}
              photo={membre.photo}
            />
          ))}
        </div>
      )}

      {courant === 'tarifs' && e.budget_min && e.budget_max && (
        <div>
          <p style={{ font: "800 30px/1 'Inter', sans-serif", color: '#1D3557', margin: '0 0 6px' }}>
            {formaterMad(e.budget_min)} – {formaterMad(e.budget_max)}
          </p>
          <p style={{ font: "400 14px/1.5 'Inter', sans-serif", color: '#5A6472', margin: 0 }}>
            Budget annuel indicatif — variable selon le niveau et les options choisies.
          </p>
        </div>
      )}

      {courant === 'faq' && (
        <div>
          {e.faq?.map((item) => (
            <details key={item.q} style={{ borderBottom: '1px solid #ECEEF1', padding: '12px 0' }}>
              <summary style={{ font: "600 15px/1.4 'Inter', sans-serif", cursor: 'pointer' }}>
                {item.q}
              </summary>
              <p style={{ font: "400 14px/1.6 'Inter', sans-serif", color: '#5A6472', margin: '8px 0 0' }}>
                {item.r}
              </p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Une carte d'avis — `ReviewCard` du design system, plus un signalement
 * (RG07) que la maquette place juste en dessous. Contrairement à la maquette,
 * pas de compteur « utile » : aucun vote de ce genre n'existe dans le schéma,
 * et l'inventer afficherait un chiffre qui ne représente rien.
 */
function CarteAvis({ avis }: { avis: AvisPublic }) {
  const [signalementOuvert, setSignalementOuvert] = useState(false);
  const [motif, setMotif] = useState('');

  const signalement = useMutation({
    mutationFn: () => signalerAvis(avis.id, { motif }),
  });

  return (
    <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
      <ReviewCard
        author={avis.auteur_nom}
        date={formaterDepuis(avis.depose_le)}
        rating={avis.note}
        body={avis.commentaire}
        reply={avis.reponse}
        style={{ border: 'none', borderRadius: 0 }}
      />

      <div style={{ margin: '0 16px', padding: '12px 0 16px', borderTop: '1px solid #F1ECE3' }}>
        {signalement.isSuccess ? (
          <p style={{ font: "400 12.5px/1 'Inter', sans-serif", color: '#5A6472', margin: 0 }} role="status">
            Signalement transmis à notre équipe. Merci.
          </p>
        ) : signalementOuvert ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              signalement.mutate();
            }}
            style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}
          >
            <input
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Motif du signalement"
              required
              style={{ flex: 1, minWidth: 200, height: 36, padding: '0 10px', font: "400 13px/1 'Inter', sans-serif", border: '1px solid #E1E5EA', borderRadius: 8 }}
            />
            <button
              type="submit"
              disabled={signalement.isPending}
              style={{ font: "600 12.5px/1 'Inter', sans-serif", color: '#fff', background: '#5A6472', border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}
            >
              {signalement.isPending ? 'Envoi…' : 'Envoyer'}
            </button>
            <button
              type="button"
              onClick={() => setSignalementOuvert(false)}
              style={{ font: "600 12.5px/1 'Inter', sans-serif", color: '#9AA3AF', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Annuler
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setSignalementOuvert(true)}
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#9AA3AF', background: 'none', border: 'none', padding: 0 }}
          >
            <Icon name="flag" size={14} color="#9AA3AF" />
            Signaler
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Formulaire de demande de contact — RG09.
 *
 * Le bouton reste INACTIF tant que le consentement n'est pas coché : la loi
 * 09-08 exige un accord explicite, et l'API refuse la demande sans lui. Mieux
 * vaut empêcher l'envoi que d'afficher un rejet après coup.
 */
function FormulaireContact({ slug, onEnvoye }: { slug: string; onEnvoye: () => void }) {
  const [nom, setNom] = useState('');
  const [tel, setTel] = useState('');
  const [message, setMessage] = useState('');
  const [consentement, setConsentement] = useState(false);

  const envoi = useMutation({
    mutationFn: () =>
      envoyerDemandeContact(slug, {
        parent_nom: nom,
        parent_tel: tel,
        message: message || undefined,
        canal: 'formulaire',
        consentement,
      }),
    onSuccess: onEnvoye,
  });

  const erreur = envoi.error instanceof ApiError ? envoi.error : null;

  if (envoi.isSuccess) {
    return (
      <div
        style={{ background: '#E6F4EC', border: '1px solid #BCE3CC', borderRadius: 14, padding: 20 }}
        role="status"
      >
        <p style={{ font: "700 15px/1.3 'Inter', sans-serif", color: '#1F7A44', margin: '0 0 6px' }}>
          Demande envoyée
        </p>
        <p style={{ font: "400 13px/1.6 'Inter', sans-serif", color: '#2A313B', margin: 0 }}>
          L&rsquo;établissement vous recontactera au numéro indiqué.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(evenement) => {
        evenement.preventDefault();
        envoi.mutate();
      }}
      style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 14, padding: 20 }}
    >
      <p style={{ font: "700 17px/1.3 'Inter', sans-serif", color: '#1A1A1A', margin: '0 0 4px' }}>
        Demander des informations
      </p>
      <p style={{ font: "400 13px/1.5 'Inter', sans-serif", color: '#5A6472', margin: '0 0 16px' }}>
        Gratuit et sans engagement.
      </p>

      {erreur && erreur.champs.length === 0 && <AlerteErreur>{erreur.message}</AlerteErreur>}

      <Champ
        label="Votre nom"
        valeur={nom}
        onChange={setNom}
        requis
        autoComplete="name"
        erreur={messageChamp(erreur, 'parent_nom')}
      />
      <Champ
        label="Téléphone"
        type="tel"
        valeur={tel}
        onChange={setTel}
        requis
        autoComplete="tel"
        placeholder="06 12 34 56 78"
        erreur={messageChamp(erreur, 'parent_tel')}
      />
      <ZoneTexte
        label="Message (facultatif)"
        valeur={message}
        onChange={setMessage}
        lignes={3}
        erreur={messageChamp(erreur, 'message')}
      />

      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={consentement}
          onChange={(evenement) => setConsentement(evenement.target.checked)}
          style={{ marginTop: 3 }}
        />
        <span style={{ font: "400 12px/1.5 'Inter', sans-serif", color: '#5A6472' }}>
          J&rsquo;accepte que mes coordonnées soient transmises à cet établissement afin qu&rsquo;il
          me recontacte (loi 09-08).
        </span>
      </label>

      {/* Inactif sans consentement, et pendant l'envoi : une double soumission
          créerait deux demandes et deux leads pour le même parent. */}
      <BoutonPrimaire pleineLargeur desactive={!consentement || envoi.isPending}>
        {envoi.isPending ? 'Envoi…' : 'Envoyer ma demande'}
      </BoutonPrimaire>
    </form>
  );
}

/**
 * Dépôt d'un avis — RG06.
 *
 * L'AVIS NAÎT « EN ATTENTE », ET ON LE DIT AVANT L'ENVOI. Un parent qui ne
 * verrait pas son avis apparaître croirait à une censure ou à un bug, et le
 * redéposerait. L'annoncer en amont coûte une phrase et évite les deux.
 */
function FormulaireAvis({ slug }: { slug: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState('');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');

  const envoi = useMutation({
    mutationFn: () =>
      deposerAvis(slug, { auteur_nom: nom, auteur_contact: contact, note, commentaire }),
  });

  const erreur = envoi.error instanceof ApiError ? envoi.error : null;

  if (envoi.isSuccess) {
    return (
      <div
        style={{ background: '#E6F4EC', border: '1px solid #BCE3CC', borderRadius: 12, padding: 18, marginTop: 8 }}
        role="status"
      >
        <p style={{ font: "700 15px/1.3 'Inter', sans-serif", color: '#1F7A44', margin: '0 0 6px' }}>
          Merci, votre avis a bien été reçu
        </p>
        <p style={{ font: "400 13px/1.6 'Inter', sans-serif", color: '#2A313B', margin: 0 }}>
          Il sera publié après relecture par notre équipe.
        </p>
      </div>
    );
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        style={{
          font: "600 14px/1 'Inter', sans-serif",
          color: '#1D3557',
          background: '#fff',
          border: '1px solid #D4DAE2',
          borderRadius: 10,
          padding: '12px 18px',
          cursor: 'pointer',
          marginTop: 8,
        }}
      >
        Donner mon avis
      </button>
    );
  }

  return (
    <form
      onSubmit={(evenement) => {
        evenement.preventDefault();
        envoi.mutate();
      }}
      style={{ border: '1px solid #ECEEF1', borderRadius: 12, padding: 18, marginTop: 8, background: '#FBFCFD' }}
    >
      <p style={{ font: "700 15px/1.3 'Inter', sans-serif", color: '#1A1A1A', margin: '0 0 4px' }}>
        Votre avis sur cet établissement
      </p>
      <p style={{ font: "400 12px/1.6 'Inter', sans-serif", color: '#5A6472', margin: '0 0 16px' }}>
        Publié après relecture. Votre moyen de contact reste privé : il ne sert qu&rsquo;à vérifier
        que l&rsquo;avis est authentique, et n&rsquo;apparaîtra jamais sur le site.
      </p>

      {erreur && erreur.champs.length === 0 && <AlerteErreur>{erreur.message}</AlerteErreur>}

      <ChoixNote valeur={note} onChange={setNote} erreur={messageChamp(erreur, 'note')} />
      <Champ
        label="Votre nom"
        valeur={nom}
        onChange={setNom}
        requis
        placeholder="Karima B."
        aide="Un prénom et une initiale suffisent."
        erreur={messageChamp(erreur, 'auteur_nom')}
      />
      <Champ
        label="E-mail ou téléphone"
        valeur={contact}
        onChange={setContact}
        requis
        aide="Jamais affiché publiquement."
        erreur={messageChamp(erreur, 'auteur_contact')}
      />
      <ZoneTexte
        label="Votre commentaire"
        valeur={commentaire}
        onChange={setCommentaire}
        requis
        lignes={4}
        erreur={messageChamp(erreur, 'commentaire')}
      />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <BoutonPrimaire desactive={note === 0 || envoi.isPending}>
          {envoi.isPending ? 'Envoi…' : 'Publier mon avis'}
        </BoutonPrimaire>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          style={{
            font: "600 14px/1 'Inter', sans-serif",
            color: '#5A6472',
            background: 'transparent',
            border: 'none',
            padding: '13px 12px',
            cursor: 'pointer',
          }}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

/** Message d'un champ précis dans une erreur 422 (livrable 13 §3). */
function messageChamp(erreur: ApiError | null, champ: string): string | undefined {
  return erreur?.champs.find((c) => c.champ === champ)?.contraintes[0];
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 14, padding: 20, marginBottom: 20 }}>
      <h2 style={{ font: "700 18px/1.3 'Inter', sans-serif", color: '#1D3557', margin: '0 0 14px' }}>
        {titre}
      </h2>
      {children}
    </section>
  );
}

/** Encadré de la colonne de droite — horaires, réseaux, autres projets. */
function BlocLateral({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 14, padding: 16, marginTop: 16 }}>
      <p
        style={{
          font: "700 11px/1 'Inter', sans-serif",
          letterSpacing: '.6px',
          textTransform: 'uppercase',
          color: '#9AA3AF',
          margin: '0 0 10px',
        }}
      >
        {titre}
      </p>
      {children}
    </div>
  );
}

function LigneInfo({ intitule, valeur }: { intitule: string; valeur: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '7px 0',
        borderBottom: '1px solid #F1F3F6',
        font: "400 13px/1.4 'Inter', sans-serif",
      }}
    >
      <span style={{ color: '#5A6472' }}>{intitule}</span>
      <span style={{ fontWeight: 600, textAlign: 'right', color: '#1A1A1A' }}>{valeur}</span>
    </div>
  );
}

function Puce({ texte, fond, couleur }: { texte: string; fond: string; couleur: string }) {
  return (
    <span style={{ font: "600 11px/1 'Inter', sans-serif", padding: '6px 9px', borderRadius: 6, background: fond, color: couleur }}>
      {texte}
    </span>
  );
}

/**
 * Bandeau « Établissement multi-cycles » — maquette de la fiche.
 *
 * CHAQUE CYCLE EST UNE FICHE À PART, et les puces y mènent. C'est le modèle de
 * la maquette, et il se défend : les filières, les tarifs et les avis d'une
 * crèche n'ont rien à voir avec ceux d'un lycée. Les fondre en une seule page
 * obligerait à tout dupliquer à l'intérieur, et le parent ne saurait plus ce
 * qui s'applique à son enfant.
 *
 * RIEN NE S'AFFICHE HORS GROUPE : une école unique n'a pas de frères, et un
 * bandeau à une seule puce serait du bruit.
 */
function BandeauCycles({ etablissement }: { etablissement: EtablissementDetail }) {
  if (!etablissement.groupe || etablissement.cycles.length < 2) {
    return null;
  }

  return (
    <div
      style={{
        marginBottom: 28,
        background: '#E7EDF5',
        border: '1px solid #D5E0EE',
        borderRadius: 14,
        padding: '16px 18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: '#1D3557',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          <Icon name="building" size={16} color="#fff" />
        </span>
        <span style={{ font: "700 14px/1.3 'Inter', sans-serif", color: '#1D3557' }}>
          Établissement multi-cycles · {etablissement.groupe.nom}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
        {etablissement.cycles.map((cycle) =>
          cycle.actif ? (
            // La fiche courante : une puce pleine, qui ne mène nulle part.
            <span
              key={cycle.slug}
              aria-current="page"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                font: "600 13px/1 'Inter', sans-serif",
                padding: '8px 14px',
                borderRadius: 20,
                background: '#1D3557',
                border: '1px solid #1D3557',
                color: '#fff',
              }}
            >
              {LIBELLE_TYPE[cycle.type]}
            </span>
          ) : (
            <Link
              key={cycle.slug}
              to={`/etablissements/${cycle.slug}`}
              title={cycle.nom}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                font: "600 13px/1 'Inter', sans-serif",
                padding: '8px 14px',
                borderRadius: 20,
                background: '#fff',
                border: '1px solid #C7D3E2',
                color: '#1D3557',
              }}
            >
              {LIBELLE_TYPE[cycle.type]}
            </Link>
          ),
        )}
      </div>

      <p style={{ margin: '11px 0 0', font: "400 12.5px/1.5 'Inter', sans-serif", color: '#5A6472' }}>
        Le même groupe scolaire accompagne votre enfant de la crèche au lycée. Cliquez un cycle
        pour ouvrir sa fiche.
      </p>
    </div>
  );
}

/**
 * Vidéo de présentation — maquette de la fiche.
 *
 * UNE VIGNETTE ET UN BOUTON, PAS UN LECTEUR CHARGÉ D'EMBLÉE. Un `iframe`
 * YouTube posé au chargement tire près d'un mégaoctet et installe ses traceurs
 * avant même qu'on ait cliqué — sur une page qu'un parent ouvre depuis un
 * forfait mobile marocain, c'est cher payé pour une vidéo qu'il ne regardera
 * peut-être pas. Le lecteur n'arrive qu'au clic.
 */
function VideoPresentation({ etablissement: e }: { etablissement: EtablissementDetail }) {
  const [lance, setLance] = useState(false);

  if (!e.video_url) return null;

  const identifiant = identifiantYouTube(e.video_url);

  return (
    <Bloc titre="Vidéo de présentation">
      <div
        style={{
          position: 'relative',
          borderRadius: 14,
          overflow: 'hidden',
          background: '#1D3557',
          aspectRatio: '16 / 9',
        }}
      >
        {lance && identifiant ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${identifiant}?autoplay=1`}
            title={`Vidéo de présentation — ${e.nom}`}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <button
            type="button"
            onClick={() => (identifiant ? setLance(true) : window.open(e.video_url!, '_blank'))}
            aria-label={`Lire la vidéo de présentation de ${e.nom}`}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: e.video_poster
                ? `#1D3557 url(${e.video_poster}) center/cover`
                : identifiant
                  ? `#1D3557 url(https://i.ytimg.com/vi/${identifiant}/hqdefault.jpg) center/cover`
                  : '#1D3557',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                width: 66,
                height: 66,
                borderRadius: '50%',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(0,0,0,.25)',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#E63946" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </Bloc>
  );
}

/**
 * Identifiant d'une vidéo YouTube, quelle que soit la forme du lien.
 *
 * Rend `null` pour une URL d'une autre plateforme : le bouton ouvre alors le
 * lien dans un onglet plutôt que d'afficher un lecteur qui ne lirait rien.
 */
function identifiantYouTube(url: string): string | null {
  const correspondance = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );

  return correspondance?.[1] ?? null;
}

/**
 * Autres enseignes du même propriétaire — maquette de la fiche.
 *
 * EN SECTION PLEINE LARGEUR, pas en encart latéral : ce sont des commerces
 * distincts — restaurant, café, résidence — et la maquette leur donne des
 * cartes avec photo. Les tasser dans la colonne de droite les rendait
 * illisibles et laissait croire à des annexes de l'école.
 */
function AutresProjets({ etablissement: e }: { etablissement: EtablissementDetail }) {
  if (!e.autres_projets?.length) return null;

  return (
    <section style={{ marginTop: 56 }}>
      <h2 style={{ margin: '0 0 6px', font: "800 24px/1.2 'Inter', sans-serif", letterSpacing: '-0.5px' }}>
        Autres projets du propriétaire
      </h2>
      <p style={{ margin: '0 0 22px', font: "400 14.5px/1.6 'Inter', sans-serif", color: '#5A6472' }}>
        Le même propriétaire gère d&rsquo;autres enseignes. Découvrez-les.
      </p>

      <div className="e3-blog-grille">
        {e.autres_projets.map((projet) => (
          <div
            key={projet.nom}
            style={{
              background: '#fff',
              border: '1px solid #EAE6DE',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {/* AUCUNE PHOTO N'EST RENSEIGNÉE pour ces enseignes : l'aplat sable
                du design system tient la carte, plutôt qu'un cadre gris vide. */}
            <div
              style={{
                height: 140,
                background: '#F1ECE3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  background: '#fff',
                  border: '1px solid #EAE6DE',
                  borderRadius: 8,
                  padding: '5px 11px',
                  font: "700 11.5px/1 'Inter', sans-serif",
                  color: '#5A6472',
                }}
              >
                {projet.type}
              </span>
            </div>

            <div style={{ padding: 18 }}>
              <div style={{ font: "700 16px/1.3 'Inter', sans-serif" }}>{projet.nom}</div>
              {projet.ville && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    font: "400 13px/1.4 'Inter', sans-serif",
                    color: '#9AA3AF',
                    marginTop: 5,
                  }}
                >
                  <Icon name="map-pin" size={12} color="#9AA3AF" />
                  {projet.ville}
                </div>
              )}
              {projet.description && (
                <p
                  style={{
                    margin: '10px 0 0',
                    font: "400 13.5px/1.6 'Inter', sans-serif",
                    color: '#5A6472',
                  }}
                >
                  {projet.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Articles & actualités — maquette de la fiche.
 *
 * DEUX SOURCES, UN SEUL BLOC. Si l'établissement publie, ce sont ses articles ;
 * sinon on se rabat sur ceux du site. La maquette montre exactement ces deux
 * cas, et la règle est bonne : une fiche sans actualité ne doit pas afficher un
 * cadre vide, mais elle ne doit pas non plus faire passer un article de la
 * rédaction pour une nouvelle de l'école — d'où le sous-titre qui le dit.
 */
function ArticlesFiche({ slug, nom }: { slug: string; nom: string }) {
  const siens = useQuery({
    queryKey: ['articles', 'etablissement', slug],
    queryFn: () => chargerArticlesEtablissement(slug),
  });
  const duSite = useQuery({
    queryKey: ['articles', 'accueil'],
    queryFn: () => chargerArticles(),
    enabled: siens.isSuccess && siens.data.length === 0,
  });

  const propres = siens.data ?? [];
  const articles = propres.length > 0 ? propres : (duSite.data?.data ?? []).slice(0, 3);

  if (articles.length === 0) return null;

  return (
    <section style={{ marginTop: 56 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 22,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              font: "700 12px/1 'Inter', sans-serif",
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: '#E63946',
              marginBottom: 8,
            }}
          >
            Le blog
          </div>
          <h2 style={{ margin: 0, font: "800 24px/1.2 'Inter', sans-serif", letterSpacing: '-0.5px' }}>
            Articles &amp; actualités
          </h2>
        </div>

        <p
          style={{
            margin: 0,
            font: "400 13px/1.5 'Inter', sans-serif",
            color: '#9AA3AF',
            maxWidth: 360,
            textAlign: 'right',
          }}
        >
          {propres.length > 0
            ? `Publiés par ${nom}.`
            : `${nom} n’a pas encore publié. Voici les articles d’écoles360.`}
        </p>
      </div>

      <div className="e3-blog-grille">
        {articles.map((article) => (
          <CarteBlog key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}

/**
 * Établissements similaires — maquette de la fiche.
 *
 * MÊME TYPE, MÊME VILLE D'ABORD : un parent qui regarde un lycée de Casablanca
 * compare avec d'autres lycées de Casablanca. Les cycles frères du même groupe
 * sont exclus côté serveur — ils ont déjà leur bandeau en haut de page.
 */
function EtablissementsSimilaires({ slug, type }: { slug: string; type: TypeEtablissement }) {
  const similaires = useQuery({
    queryKey: ['etablissements', 'similaires', slug],
    queryFn: () => chargerSimilaires(slug),
  });

  if (!similaires.data?.length) return null;

  return (
    <section style={{ marginTop: 56, marginBottom: 24 }}>
      <h2 style={{ margin: '0 0 22px', font: "800 24px/1.2 'Inter', sans-serif", letterSpacing: '-0.5px' }}>
        {LIBELLE_TYPE[type]}s similaires
      </h2>

      <div className="e3-blog-grille">
        {similaires.data.map((autre) => (
          <Link
            key={autre.id}
            to={`/etablissements/${autre.slug}`}
            className="e3-card"
            style={{
              background: '#fff',
              border: '1px solid #EAE6DE',
              borderRadius: 16,
              overflow: 'hidden',
              color: 'inherit',
              display: 'block',
            }}
          >
            <div
              style={{
                height: 140,
                background: autre.photo
                  ? `#E3E7EC url(${autre.photo.chemin}) center/cover`
                  : '#F1ECE3',
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: '#fff',
                  border: '1px solid #EAE6DE',
                  borderRadius: 8,
                  padding: '4px 10px',
                  font: "700 11px/1 'Inter', sans-serif",
                  color: '#5A6472',
                }}
              >
                {LIBELLE_TYPE[autre.type]}
              </span>
            </div>

            <div style={{ padding: 18 }}>
              <div style={{ font: "700 16px/1.3 'Inter', sans-serif" }}>{autre.nom}</div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  font: "400 13px/1.4 'Inter', sans-serif",
                  color: '#9AA3AF',
                  marginTop: 5,
                }}
              >
                <Icon name="map-pin" size={12} color="#9AA3AF" />
                {autre.quartier ? `${autre.quartier} — ` : ''}
                {autre.ville.nom}
              </div>
              <div style={{ marginTop: 10, font: "400 13.5px/1 'Inter', sans-serif" }}>
                <span style={{ color: '#E9A23B', fontWeight: 700 }}>
                  ★ {formaterNote(autre.note_moy)}
                </span>
                <span style={{ color: '#9AA3AF' }}>
                  {' '}
                  · {formaterNombre(autre.nb_avis)} avis
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * Situation sur la carte — colonne de droite de la maquette.
 *
 * UNE IMAGE STATIQUE ET UN LIEN, PAS UNE CARTE INTERACTIVE. Google Maps facturé
 * à la requête sur ~8 000 fiches coûterait une fortune, et son script pose des
 * traceurs sur chaque page vue. L'aperçu OpenStreetMap suffit à situer, et le
 * lien ouvre l'itinéraire dans l'application que le visiteur utilise déjà.
 */
function SituationCarte({ etablissement: e }: { etablissement: EtablissementDetail }) {
  if (!e.lat || !e.lng) return null;

  const cadre = [
    Number(e.lng) - 0.008,
    Number(e.lat) - 0.006,
    Number(e.lng) + 0.008,
    Number(e.lat) + 0.006,
  ].join('%2C');

  return (
    <BlocLateral titre="Situation">
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #ECEEF1' }}>
        <iframe
          title={`Carte — ${e.nom}`}
          loading="lazy"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${cadre}&layer=mapnik&marker=${e.lat}%2C${e.lng}`}
          style={{ width: '100%', height: 190, border: 0, display: 'block' }}
        />
      </div>

      <a
        href={`https://www.google.com/maps/search/?api=1&query=${e.lat},${e.lng}`}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          marginTop: 12,
          font: "600 13px/1 'Inter', sans-serif",
          color: '#1D3557',
        }}
      >
        <Icon name="external-link" size={14} color="#1D3557" />
        Ouvrir l&rsquo;itinéraire
      </a>
    </BlocLateral>
  );
}

/**
 * Galerie de la fiche — maquette de l'écran établissement.
 *
 * AUCUNE LIMITE DE PHOTOS, ET C'EST VOULU. Un établissement qui en téléverse
 * quinze doit pouvoir les montrer toutes : les puces se resserrent, le
 * défilement continue, rien ne se tronque. Une galerie plafonnée obligerait
 * l'école à choisir, et choisirait en réalité à sa place.
 *
 * DÉFILEMENT TOUTES LES CINQ SECONDES, comme le héros de l'accueil. Il s'arrête
 * dès qu'on prend la main — sur une flèche ou une puce : quelqu'un qui regarde
 * une photo précise ne veut pas qu'elle disparaisse sous ses yeux.
 *
 * `prefers-reduced-motion` NE L'ARRÊTE PAS. Ce réglage demande de réduire le
 * mouvement superflu, pas de retirer du contenu : un fondu entre deux photos
 * est une transition, et couper le défilement cacherait six vues sur sept à
 * exactement les visiteurs qu'on croyait ménager. Les flèches et les puces
 * restent là pour qui préfère naviguer lui-même.
 */
function GalerieFiche({ photos, nom }: { photos: { chemin: string; alt: string | null }[]; nom: string }) {
  const [index, setIndex] = useState(0);
  const [manuel, setManuel] = useState(false);

  const total = photos.length;

  useEffect(() => {
    if (manuel || total < 2) return;

    const minuteur = window.setInterval(() => setIndex((i) => (i + 1) % total), CADENCE_GALERIE_MS);

    return () => window.clearInterval(minuteur);
  }, [manuel, total]);

  if (total === 0) {
    return null;
  }

  /** Reprendre la main fige le défilement pour le reste de la visite. */
  const aller = (cible: number) => {
    setManuel(true);
    setIndex(((cible % total) + total) % total);
  };

  const courante = photos[index] ?? photos[0]!;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 18,
        overflow: 'hidden',
        background: '#E3E7EC',
        aspectRatio: '16 / 7',
        marginBottom: 24,
      }}
    >
      {photos.map((photo, rang) => (
        <div
          key={photo.chemin}
          aria-hidden={rang !== index}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('${photo.chemin}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: rang === index ? 1 : 0,
            transition: 'opacity .8s ease',
          }}
        />
      ))}

      {/* La légende de la vue — « Façade », « Laboratoire »… */}
      {courante.alt && (
        <span
          style={{
            position: 'absolute',
            left: 16,
            bottom: 16,
            background: 'rgba(26,26,26,.72)',
            color: '#fff',
            font: "600 13px/1 'Inter', sans-serif",
            padding: '8px 14px',
            borderRadius: 8,
          }}
        >
          {courante.alt}
        </span>
      )}

      {total > 1 && (
        <>
          <FlecheGalerie sens="precedent" onClick={() => aller(index - 1)} />
          <FlecheGalerie sens="suivant" onClick={() => aller(index + 1)} />

          {/*
            UNE PUCE PAR PHOTO, SANS PLAFOND. Elles se resserrent plutôt que de
            se tronquer : sur quinze vues, quinze traits fins valent mieux que
            « … » qui ne dit pas combien il en reste.
          */}
          <div
            style={{
              position: 'absolute',
              right: 16,
              bottom: 18,
              display: 'flex',
              gap: total > 10 ? 4 : 6,
              alignItems: 'center',
              maxWidth: '55%',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            {photos.map((photo, rang) => (
              <button
                key={photo.chemin}
                type="button"
                onClick={() => aller(rang)}
                aria-label={`Photo ${rang + 1} sur ${total}${photo.alt ? ` — ${photo.alt}` : ''}`}
                aria-current={rang === index}
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0,
                  height: 4,
                  width: rang === index ? 26 : total > 10 ? 8 : 14,
                  borderRadius: 4,
                  background: rang === index ? '#fff' : 'rgba(255,255,255,.45)',
                  transition: 'all .3s ease',
                }}
              />
            ))}
          </div>
        </>
      )}

      <span className="visuellement-cache">
        Galerie de {nom} — photo {index + 1} sur {total}
      </span>
    </div>
  );
}

/** Flèche ronde blanche de la galerie — 44 px, comme la maquette. */
function FlecheGalerie({ sens, onClick }: { sens: 'precedent' | 'suivant'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={sens === 'precedent' ? 'Photo précédente' : 'Photo suivante'}
      style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        [sens === 'precedent' ? 'left' : 'right']: 16,
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(255,255,255,.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        boxShadow: '0 4px 14px rgba(0,0,0,.18)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={sens === 'precedent' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} />
      </svg>
    </button>
  );
}

/**
 * Carte d'identité — colonne de droite de la maquette.
 *
 * ELLE RÉPOND AUX QUESTIONS QU'ON SE POSE AVANT DE LIRE. Badges, note, budget,
 * langues, localité : un parent décide d'aller plus loin ou non sur ces cinq
 * lignes, et la maquette les met à hauteur du titre pour cette raison. Les
 * éparpiller plus bas obligeait à faire défiler pour savoir si la fiche vaut
 * la peine.
 */
function CarteIdentite({ etablissement: e }: { etablissement: EtablissementDetail }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #ECEEF1',
        borderRadius: 16,
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {e.sponsorise && <Puce texte="Sponsorisé" fond="#E63946" couleur="#fff" />}
        {e.verifie && <Puce texte="✓ Vérifié" fond="#E6F4EC" couleur="#1F7A44" />}
        <Puce texte={LIBELLE_TYPE[e.type]} fond="#F1F3F6" couleur="#5A6472" />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          paddingBottom: 14,
          borderBottom: '1px solid #F1ECE3',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 7 }}>
          <span style={{ color: '#E9A23B', font: "700 24px/1 'Inter', sans-serif" }} aria-hidden>
            ★
          </span>
          <span style={{ font: "800 24px/1 'Inter', sans-serif" }}>{formaterNote(e.note_moy)}</span>
          <span style={{ font: "400 14px/1 'Inter', sans-serif", color: '#5A6472' }}>
            ({formaterNombre(e.nb_avis)} avis)
          </span>
        </span>

        {/* La gamme tarifaire, en points rouges comme la maquette. */}
        {e.premium && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#E63946', font: "700 15px/1 'Inter', sans-serif", letterSpacing: 1 }} aria-hidden>
              •••
            </span>
            <span style={{ font: "600 13.5px/1 'Inter', sans-serif", color: '#1A1A1A' }}>Premium</span>
          </span>
        )}
      </div>

      <div style={{ paddingTop: 6 }}>
        {e.budget_min && e.budget_max && (
          <LigneInfo
            intitule="Budget"
            valeur={`${formaterMad(e.budget_min)} – ${formaterMad(e.budget_max)}/an`}
          />
        )}
        {e.langues && <LigneInfo intitule="Langues" valeur={e.langues} />}
        <LigneInfo
          intitule="Localité"
          valeur={`${e.quartier ? `${e.quartier}, ` : ''}${e.ville.nom}`}
        />
      </div>
    </div>
  );
}

/** Ligne de coordonnée : une icône, une valeur. */
function LigneContact({ icone, valeur }: { icone: string; valeur: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
      <Icon name={icone} size={15} color="#9AA3AF" />
      <span style={{ font: "400 14px/1.4 'Inter', sans-serif", color: '#1A1A1A', minWidth: 0 }}>
        {valeur}
      </span>
    </div>
  );
}
