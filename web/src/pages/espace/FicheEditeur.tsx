import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  ajouterMesPhotos,
  annulerProposition,
  chargerFicheEspace,
  chargerMesPhotos,
  legenderMaPhoto,
  proposerModifications,
  remplacerMaPhoto,
  reordonnerMesPhotos,
  supprimerMaPhoto,
  type ChampsModifies,
  type FicheEspace,
  type ModificationsFiche,
} from '@/api/espace';
import { ApercuFiche } from '@/components/ApercuFiche';
import { GaleriePhotos } from '@/components/GaleriePhotos';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { AlerteErreur, Champ, ZoneTexte } from '@/components/Champs';
import { Button, Tabs } from '@/ds/composants';
import { formaterDate } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

/** Intitulés lisibles des champs — utilisés dans le comparatif avant / après. */
const LIBELLE_CHAMP: Record<string, string> = {
  nom: 'Nom',
  description: 'Présentation',
  adresse: 'Adresse',
  quartier: 'Quartier',
  tel: 'Téléphone',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  budget_min: 'Budget minimum',
  budget_max: 'Budget maximum',
  chiffres: 'Chiffres clés',
  faq: 'Questions fréquentes',
  horaires: 'Horaires',
  socials: 'Réseaux sociaux',
  autres_projets: 'Autres projets',
  facilites: 'Équipements',
  equipe: 'Équipe',
  video_url: 'Vidéo',
  gamme_label: 'Gamme tarifaire',
};

/**
 * Ma fiche — écran `isFichePage` de la maquette, côté établissement.
 *
 * AUCUNE MODIFICATION N'EST PUBLIÉE ICI (RG20). Le formulaire dépose une
 * proposition ; la fiche publique ne bouge qu'après validation. L'écran le dit
 * avant l'envoi et le rappelle tant que la proposition est en attente — un
 * client qui ne verrait pas son changement en ligne croirait à une panne.
 *
 * ÉCART ASSUMÉ avec la maquette : pas de prévisualisation de la page publique
 * avec la proposition déjà appliquée. Le comparatif avant / après est bien là,
 * sous forme de tableau — c'est l'information, sans la mise en scène.
 */
export function FicheEditeur() {
  useTitrePage('Ma fiche');

  return (
    <AvecIdentite
      role={['etablissement', 'secretariat']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Ma fiche"
          sousTitre="Votre page profil — les modifications sont publiées après validation de l’administration"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const queryClient = useQueryClient();
  const [edition, setEdition] = useState(false);
  const fiche = useQuery({ queryKey: ['espace', 'fiche'], queryFn: chargerFicheEspace });

  if (fiche.isPending) {
    return <p style={texteDoux}>Chargement…</p>;
  }

  if (fiche.isError || !fiche.data) {
    return <p style={{ ...texteDoux, color: '#E63946' }}>La fiche n’a pas pu être chargée.</p>;
  }

  const rafraichir = () => {
    void queryClient.invalidateQueries({ queryKey: ['espace', 'fiche'] });
  };

  const enAttente = Boolean(fiche.data.proposition_en_attente);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ flex: 1, minWidth: 220, fontSize: 13, color: '#5A6472' }}>
          {edition
            ? 'Vos modifications seront soumises à validation avant d’apparaître en ligne.'
            : 'Votre page profil telle que les parents la voient sur écoles360.'}
        </span>

        {edition ? (
          <Button variant="outline" size="sm" onClick={() => setEdition(false)}>
            Annuler
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEdition(true)}
            disabled={enAttente}
          >
            Modifier
          </Button>
        )}
      </div>

      {fiche.data.proposition_en_attente && (
        <BandeauEnAttente proposition={fiche.data.proposition_en_attente} onAnnule={rafraichir} />
      )}

      {edition ? (
        <Formulaire
          fiche={fiche.data}
          onEnvoye={() => {
            rafraichir();
            setEdition(false);
          }}
        />
      ) : (
        <ApercuFiche fiche={fiche.data} />
      )}

      {/*
        LA GALERIE EST HORS DU FORMULAIRE, et hors du circuit de validation.
        Une photo part en ligne tout de suite, là où le texte attend l'accord
        de l'administration (RG20) : elle n'affirme rien qui engage la
        plateforme. La séparer visuellement évite de laisser croire qu'elle
        aussi est « en attente » quand une proposition l'est.
      */}
      <GaleriePhotos
        titre="Photos de l’établissement"
        cle={['espace', 'photos']}
        aInvalider={['espace', 'fiche']}
        operations={{
          lister: chargerMesPhotos,
          ajouter: ajouterMesPhotos,
          remplacer: remplacerMaPhoto,
          legender: legenderMaPhoto,
          supprimer: supprimerMaPhoto,
          reordonner: reordonnerMesPhotos,
        }}
      />
    </div>
  );
}

function BandeauEnAttente({
  proposition,
  onAnnule,
}: {
  proposition: NonNullable<FicheEspace['proposition_en_attente']>;
  onAnnule: () => void;
}) {
  const annulation = useMutation({
    mutationFn: () => annulerProposition(proposition.id),
    onSuccess: onAnnule,
  });

  return (
    <div
      style={{
        background: '#FCF1DE',
        border: '1px solid #F0D18B',
        borderRadius: 14,
        padding: '15px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: '#7A5B12' }}>
            Modifications en attente de validation
          </div>
          <div style={{ fontSize: 12.5, color: '#7A5B12', marginTop: 2 }}>
            Envoyées le {formaterDate(proposition.proposee_le)} — elles ne seront visibles sur le
            site public qu’après approbation de l’administration.
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => annulation.mutate()}
          disabled={annulation.isPending}
        >
          {annulation.isPending ? 'Annulation…' : 'Annuler la demande'}
        </Button>
      </div>

      <Comparatif champs={proposition.champs_modifies} />
    </div>
  );
}

/**
 * Tableau avant / après — même information que le bandeau de la maquette.
 *
 * TOLÈRE UNE PROPOSITION SANS COMPARATIF. `champs_modifies` a d'abord été
 * écrit comme une simple liste de noms de champs ; les lignes créées à cette
 * époque n'ont ni « avant » ni « après ». Plutôt que d'afficher trois tirets
 * sans rien dire, on nomme les champs concernés et on signale que le détail
 * n'a pas été conservé.
 */
export function Comparatif({ champs }: { champs: ChampsModifies }) {
  if (Array.isArray(champs)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ font: "400 12.5px/1.5 'Inter', sans-serif", color: '#7A5B12', margin: 0 }}>
          Cette demande a été enregistrée avant que le comparatif ne soit conservé — seuls les
          champs concernés sont connus.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {champs.map((champ) => (
            <span
              key={champ}
              style={{
                background: '#fff',
                border: '1px solid #F0D18B',
                borderRadius: 20,
                padding: '6px 12px',
                fontSize: 12.5,
                fontWeight: 600,
                color: '#7A5B12',
              }}
            >
              {LIBELLE_CHAMP[champ] ?? champ}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Object.entries(champs).map(([champ, valeurs]) => (
        <div
          key={champ}
          className="e-diff"
          style={{
            background: '#fff',
            border: '1px solid #F0D18B',
            borderRadius: 11,
            padding: '11px 14px',
            display: 'grid',
            gridTemplateColumns: '150px 1fr 1fr',
            gap: 14,
            alignItems: 'start',
          }}
        >
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '.4px',
              textTransform: 'uppercase',
              color: '#9AA3AF',
            }}
          >
            {LIBELLE_CHAMP[champ] ?? champ}
          </span>
          <span style={{ fontSize: 13, lineHeight: 1.55, color: '#9AA3AF', textDecoration: 'line-through' }}>
            {afficher(valeurs.avant)}
          </span>
          <span style={{ fontSize: 13, lineHeight: 1.55, color: '#1A1A1A', fontWeight: 600 }}>
            {afficher(valeurs.apres)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Une valeur de fiche peut être un texte, un nombre, une liste ou un objet. */
function afficher(valeur: unknown): string {
  if (valeur === null || valeur === undefined || valeur === '') return '—';
  if (typeof valeur === 'string' || typeof valeur === 'number') return String(valeur);

  return JSON.stringify(valeur);
}

/**
 * Ce que l'école lit sur sa propre fiche — tranché par le client le
 * 7 octobre 2026 : `masquee` dit « en cours de mise à jour », `suspendue` dit
 * « retirée du site jusqu'à réactivation ». Deux situations très différentes
 * pour elle, et qui méritaient mieux qu'un « Non publiée » commun.
 */
const ETAT_FICHE: Record<FicheEspace['statut'], string> = {
  validee: 'Publiée',
  en_attente: 'En attente de validation',
  masquee: 'Hors ligne — mise à jour en cours',
  suspendue: 'Suspendue — nous contacter',
};

const COULEUR_ETAT: Record<FicheEspace['statut'], string> = {
  validee: '#1F7A45',
  en_attente: '#B57708',
  masquee: '#5A6472',
  suspendue: '#C42B38',
};

const ONGLETS = [
  { key: 'identite', label: 'Identité' },
  { key: 'contact', label: 'Contact' },
  { key: 'tarifs', label: 'Tarifs' },
  { key: 'equipements', label: 'Équipements' },
  { key: 'equipe', label: 'Équipe' },
];

function Formulaire({ fiche, onEnvoye }: { fiche: FicheEspace; onEnvoye: () => void }) {
  const [onglet, setOnglet] = useState('identite');
  const [brouillon, setBrouillon] = useState(() => versBrouillon(fiche));

  // La fiche peut changer sous nos pieds (approbation d'une proposition par un
  // admin pendant qu'on la consulte) : le brouillon se recale alors dessus.
  useEffect(() => setBrouillon(versBrouillon(fiche)), [fiche]);

  const envoi = useMutation({
    mutationFn: () => proposerModifications(diff(fiche, brouillon)),
    onSuccess: onEnvoye,
  });

  const erreur = envoi.error instanceof ApiError ? envoi.error : null;
  const modifications = diff(fiche, brouillon);
  const nbModifications = Object.keys(modifications).length;
  const bloque = Boolean(fiche.proposition_en_attente);

  const set = (champ: keyof typeof brouillon) => (valeur: string) =>
    setBrouillon((actuel) => ({ ...actuel, [champ]: valeur }));

  return (
    <form
      onSubmit={(evenement) => {
        evenement.preventDefault();
        envoi.mutate();
      }}
      style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16, overflow: 'hidden' }}
    >
      <div
        style={{
          padding: '12px 22px',
          background: '#FBFAF7',
          borderBottom: '1px solid #EAE6DE',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: '#9AA3AF' }}>
          Page profil — site public
        </span>
        <span style={{ flex: 1 }} />
        {/*
          « NON PUBLIÉE » NE DIT PAS POURQUOI, et les trois raisons ne se
          valent pas pour une école : attendre une validation, être masquée le
          temps d'une mise à jour, ou être suspendue du site. Elle n'a pas à
          téléphoner pour l'apprendre.
        */}
        <span style={{ fontSize: 12, fontWeight: 600, color: COULEUR_ETAT[fiche.statut] }}>
          {ETAT_FICHE[fiche.statut]}
        </span>
      </div>

      <div style={{ padding: '18px 22px 0' }}>
        <Tabs tabs={ONGLETS} value={onglet} onChange={setOnglet} style={{ marginBottom: 20 }} />
      </div>

      <div style={{ padding: '0 22px 20px', maxWidth: 720 }}>
        {erreur && erreur.champs.length === 0 && <AlerteErreur>{erreur.message}</AlerteErreur>}

        {onglet === 'identite' && (
          <>
            <Champ label="Nom de l’établissement" valeur={brouillon.nom} onChange={set('nom')} erreur={messageChamp(erreur, 'nom')} />
            <ZoneTexte
              label="Notre histoire"
              valeur={brouillon.description}
              onChange={set('description')}
              lignes={6}
              aide="Le premier texte de votre page profil."
              erreur={messageChamp(erreur, 'description')}
            />
            <ZoneTexte
              label="Projet pédagogique"
              valeur={brouillon.projet_pedagogique}
              onChange={set('projet_pedagogique')}
              lignes={5}
              erreur={messageChamp(erreur, 'projet_pedagogique')}
            />
            <Champ label="Adresse" valeur={brouillon.adresse} onChange={set('adresse')} erreur={messageChamp(erreur, 'adresse')} />
            <Champ label="Quartier" valeur={brouillon.quartier} onChange={set('quartier')} erreur={messageChamp(erreur, 'quartier')} />
            <Champ
              label="Langues enseignées"
              valeur={brouillon.langues}
              onChange={set('langues')}
              aide="Séparées par « · » — par exemple : Arabe · Français · Anglais."
              erreur={messageChamp(erreur, 'langues')}
            />
          </>
        )}

        {onglet === 'contact' && (
          <>
            <Champ label="Téléphone" type="tel" valeur={brouillon.tel} onChange={set('tel')} erreur={messageChamp(erreur, 'tel')} />
            <Champ label="WhatsApp" type="tel" valeur={brouillon.whatsapp} onChange={set('whatsapp')} erreur={messageChamp(erreur, 'whatsapp')} />
            <Champ label="E-mail" type="email" valeur={brouillon.email} onChange={set('email')} erreur={messageChamp(erreur, 'email')} />
            <Champ
              label="Site web"
              valeur={brouillon.site_web}
              onChange={set('site_web')}
              placeholder="https://www.votre-ecole.ma"
              erreur={messageChamp(erreur, 'site_web')}
            />
          </>
        )}

        {onglet === 'tarifs' && (
          <>
            <Champ label="Budget annuel minimum (MAD)" valeur={brouillon.budget_min} onChange={set('budget_min')} erreur={messageChamp(erreur, 'budget_min')} />
            <Champ label="Budget annuel maximum (MAD)" valeur={brouillon.budget_max} onChange={set('budget_max')} erreur={messageChamp(erreur, 'budget_max')} />
            <Champ label="Gamme affichée" valeur={brouillon.gamme_label} onChange={set('gamme_label')} aide="Par exemple « Milieu de gamme »." erreur={messageChamp(erreur, 'gamme_label')} />
          </>
        )}

        {onglet === 'equipements' && (
          <ZoneTexte
            label="Équipements et services"
            valeur={brouillon.facilites}
            onChange={set('facilites')}
            lignes={4}
            aide="Un par ligne — cantine, transport scolaire, laboratoire…"
            erreur={messageChamp(erreur, 'facilites')}
          />
        )}

        {onglet === 'equipe' && (
          <ZoneTexte
            label="Équipe pédagogique"
            valeur={brouillon.equipe}
            onChange={set('equipe')}
            lignes={6}
            aide="Une personne par ligne : Nom | Rôle | lien du portrait (facultatif). Sans portrait, ses initiales s’affichent."
            erreur={messageChamp(erreur, 'equipe')}
          />
        )}
      </div>

      <div
        style={{
          borderTop: '1px solid #EAE6DE',
          padding: '14px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          background: '#FBFAF7',
        }}
      >
        <span style={{ flex: 1, minWidth: 220, fontSize: 12.5, color: '#5A6472', lineHeight: 1.5 }}>
          {bloque
            ? 'Une proposition est déjà en attente — annulez-la pour en envoyer une nouvelle.'
            : nbModifications === 0
              ? 'Modifiez un champ pour proposer une mise à jour.'
              : `${nbModifications} champ${nbModifications > 1 ? 's' : ''} modifié${nbModifications > 1 ? 's' : ''} — publié après validation.`}
        </span>

        {envoi.isSuccess && (
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1F7A45' }} role="status">
            Proposition envoyée.
          </span>
        )}

        <Button
          variant="primary"
          size="md"
          type="submit"
          disabled={bloque || nbModifications === 0 || envoi.isPending}
        >
          {envoi.isPending ? 'Envoi…' : 'Proposer les modifications'}
        </Button>
      </div>
    </form>
  );
}

/** Tous les champs du formulaire sont manipulés en texte — conversion à l'envoi. */
function versBrouillon(fiche: FicheEspace) {
  return {
    nom: fiche.nom ?? '',
    description: fiche.description ?? '',
    adresse: fiche.adresse ?? '',
    quartier: fiche.quartier ?? '',
    tel: fiche.tel ?? '',
    whatsapp: fiche.whatsapp ?? '',
    email: fiche.email ?? '',
    budget_min: fiche.budget_min?.toString() ?? '',
    budget_max: fiche.budget_max?.toString() ?? '',
    gamme_label: fiche.gamme_label ?? '',
    facilites: (fiche.facilites ?? []).join('\n'),
    // « Nom | Rôle | portrait » par ligne — même convention que les
    // équipements : une ligne par entrée. Le portrait est facultatif et se
    // reconnaît à sa position.
    equipe: (fiche.equipe ?? [])
      .map((membre) => [membre.nom, membre.role, membre.photo].filter(Boolean).join(' | '))
      .join('\n'),
    langues: fiche.langues ?? '',
    site_web: fiche.site_web ?? '',
    projet_pedagogique: fiche.projet_pedagogique ?? '',
  };
}

/**
 * Ne retient que ce qui a réellement changé.
 *
 * Le serveur refait le même calcul et refuse une proposition vide : ce diff
 * côté client sert à désactiver le bouton et à annoncer le nombre de champs,
 * pas à faire autorité.
 */
function diff(fiche: FicheEspace, brouillon: ReturnType<typeof versBrouillon>): ModificationsFiche {
  const modifications: ModificationsFiche = {};
  const reference = versBrouillon(fiche);

  if (brouillon.nom !== reference.nom) modifications.nom = brouillon.nom;
  if (brouillon.description !== reference.description) modifications.description = brouillon.description;
  if (brouillon.adresse !== reference.adresse) modifications.adresse = brouillon.adresse;
  if (brouillon.quartier !== reference.quartier) modifications.quartier = brouillon.quartier;
  if (brouillon.tel !== reference.tel) modifications.tel = brouillon.tel;
  if (brouillon.whatsapp !== reference.whatsapp) modifications.whatsapp = brouillon.whatsapp;
  if (brouillon.email !== reference.email) modifications.email = brouillon.email;
  if (brouillon.gamme_label !== reference.gamme_label) modifications.gamme_label = brouillon.gamme_label;
  if (brouillon.langues !== reference.langues) modifications.langues = brouillon.langues;
  if (brouillon.site_web !== reference.site_web) modifications.site_web = brouillon.site_web;
  if (brouillon.projet_pedagogique !== reference.projet_pedagogique) {
    modifications.projet_pedagogique = brouillon.projet_pedagogique;
  }

  if (brouillon.budget_min !== reference.budget_min && brouillon.budget_min !== '') {
    modifications.budget_min = Number(brouillon.budget_min);
  }
  if (brouillon.budget_max !== reference.budget_max && brouillon.budget_max !== '') {
    modifications.budget_max = Number(brouillon.budget_max);
  }
  if (brouillon.facilites !== reference.facilites) {
    modifications.facilites = brouillon.facilites
      .split('\n')
      .map((ligne) => ligne.trim())
      .filter(Boolean);
  }

  /**
   * UNE LIGNE SANS RÔLE EST ÉCARTÉE, PAS ENVOYÉE À MOITIÉ. Le DTO exige un nom
   * ET un rôle ; laisser filer une ligne incomplète ferait refuser la
   * proposition ENTIÈRE en 422, et l'établissement perdrait les corrections
   * qu'il venait de faire sur les autres onglets pour une virgule oubliée ici.
   */
  if (brouillon.equipe !== reference.equipe) {
    modifications.equipe = brouillon.equipe
      .split('\n')
      .map((ligne) => ligne.split('|').map((morceau) => morceau.trim()))
      .filter(([nom, role]) => Boolean(nom) && Boolean(role))
      .map(([nom, role, photo]) => ({
        nom: nom!,
        role: role!,
        ...(photo ? { photo } : {}),
      }));
  }

  return modifications;
}

function messageChamp(erreur: ApiError | null, champ: string): string | undefined {
  return erreur?.champs.find((c) => c.champ === champ)?.contraintes[0];
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
};
