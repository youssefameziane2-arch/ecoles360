import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  chargerProfilEtablissement,
  ecrireProfilEtablissement,
  type ProfilEtablissement,
} from '@/api/admin';
import { Champ, ZoneTexte } from '@/components/Champs';
import { Button, Tabs, Toast } from '@/ds/composants';

const ONGLETS = [
  { key: 'identite', label: 'Identité' },
  { key: 'contact', label: 'Contact' },
  { key: 'tarifs', label: 'Tarifs' },
  { key: 'equipements', label: 'Équipements' },
  { key: 'equipe', label: 'Équipe' },
  { key: 'faq', label: 'FAQ' },
  { key: 'plus', label: 'Chiffres, horaires, projets' },
];

/**
 * Profil complet d'une fiche, depuis le back-office.
 *
 * POURQUOI CET ÉCRAN EXISTE. Le formulaire de création ne couvre que l'état
 * civil d'une école. Équipements, équipe, FAQ, chiffres, horaires, projet
 * pédagogique, autres projets et vidéo n'étaient renseignables que depuis
 * l'espace de l'établissement — donc jamais, tant qu'une école n'a pas de
 * compte. Or les onglets de la fiche publique ne s'affichent QUE si leur
 * donnée existe : ils restaient invisibles, et rien à l'écran ne disait
 * pourquoi.
 *
 * ÉCRITURE DIRECTE, PAS DE PROPOSITION. La RG20 borne l'établissement ; elle
 * ne demande pas à l'administration de se proposer des modifications à
 * elle-même puis de les approuver. Ce que l'on écrit ici paraît sur le site
 * dès que la fiche est validée.
 *
 * LES LISTES SE SAISISSENT EN TEXTE, une entrée par ligne, avec le même
 * séparateur « | » que l'éditeur de l'espace établissement. Ce n'est pas le
 * plus joli, c'est le plus rapide pour saisir quarante écoles à la main — et
 * c'est la convention que le projet a déjà.
 */
export function ProfilEtablissementAdmin({
  id,
  onFerme,
}: {
  id: string;
  onFerme: () => void;
}) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; texte: string } | null>(null);

  const profil = useQuery({
    queryKey: ['admin', 'profil', id],
    queryFn: () => chargerProfilEtablissement(id),
  });

  if (profil.isPending) return <Encadre>Chargement du profil…</Encadre>;

  if (profil.isError) {
    return <Encadre>Ce profil n’a pas pu être chargé.</Encadre>;
  }

  return (
    <Formulaire
      profil={profil.data}
      message={message}
      onMessage={setMessage}
      onEnregistre={() => {
        void queryClient.invalidateQueries({ queryKey: ['admin', 'profil', id] });
        void queryClient.invalidateQueries({ queryKey: ['admin', 'etablissements'] });
      }}
      onFerme={onFerme}
    />
  );
}

function Formulaire({
  profil,
  message,
  onMessage,
  onEnregistre,
  onFerme,
}: {
  profil: ProfilEtablissement;
  message: { tone: 'success' | 'error'; texte: string } | null;
  onMessage: (m: { tone: 'success' | 'error'; texte: string } | null) => void;
  onEnregistre: () => void;
  onFerme: () => void;
}) {
  const [onglet, setOnglet] = useState('identite');
  const [brouillon, setBrouillon] = useState(() => versBrouillon(profil));

  useEffect(() => setBrouillon(versBrouillon(profil)), [profil]);

  const envoi = useMutation({
    mutationFn: () => ecrireProfilEtablissement(profil.id, versCharge(brouillon)),
    onSuccess: () => {
      onMessage({
        tone: 'success',
        texte:
          profil.statut === 'validee'
            ? 'Profil enregistré — il est en ligne sur la fiche publique.'
            : 'Profil enregistré. Il paraîtra sur le site une fois la fiche validée.',
      });
      onEnregistre();
    },
    onError: (erreur: unknown) =>
      onMessage({
        tone: 'error',
        texte:
          erreur instanceof ApiError
            ? erreur.message
            : 'Le profil n’a pas pu être enregistré.',
      }),
  });

  const erreur = envoi.error instanceof ApiError ? envoi.error : null;
  const champErreur = (champ: string) =>
    erreur?.champs.find((c) => c.champ === champ)?.contraintes[0];

  const set = (champ: keyof typeof brouillon) => (valeur: string) =>
    setBrouillon((actuel) => ({ ...actuel, [champ]: valeur }));

  return (
    <form
      onSubmit={(evenement) => {
        evenement.preventDefault();
        envoi.mutate();
      }}
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderRadius: 16,
        overflow: 'hidden',
      }}
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
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.5px',
            textTransform: 'uppercase',
            color: '#9AA3AF',
          }}
        >
          Page profil — {profil.nom}
        </span>
        <span style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: profil.statut === 'validee' ? '#1F7A45' : '#B57708',
          }}
        >
          {profil.statut === 'validee' ? 'En ligne' : 'Non publiée'}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={onFerme}>
          Fermer
        </Button>
      </div>

      {message && (
        <div style={{ padding: '14px 22px 0' }}>
          <Toast
            tone={message.tone}
            title={message.tone === 'success' ? 'Enregistré' : 'Refusé'}
            message={message.texte}
            onClose={() => onMessage(null)}
          />
        </div>
      )}

      <div style={{ padding: '18px 22px 0' }}>
        <Tabs tabs={ONGLETS} value={onglet} onChange={setOnglet} style={{ marginBottom: 20 }} />
      </div>

      <div style={{ padding: '0 22px 4px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {onglet === 'identite' && (
          <>
            <Champ
              label="Nom de l’établissement"
              valeur={brouillon.nom}
              onChange={set('nom')}
              erreur={champErreur('nom')}
            />
            <ZoneTexte
              label="Présentation"
              valeur={brouillon.description}
              onChange={set('description')}
              lignes={5}
              aide="Affichée dans l’onglet « À propos » de la fiche."
              erreur={champErreur('description')}
            />
            <ZoneTexte
              label="Projet pédagogique"
              valeur={brouillon.projet_pedagogique}
              onChange={set('projet_pedagogique')}
              lignes={4}
              erreur={champErreur('projet_pedagogique')}
            />
            <Champ label="Adresse" valeur={brouillon.adresse} onChange={set('adresse')} />
            <Champ label="Quartier" valeur={brouillon.quartier} onChange={set('quartier')} />
            <Champ
              label="Langues enseignées"
              valeur={brouillon.langues}
              onChange={set('langues')}
              aide="Par exemple « Arabe · Français · Anglais »."
            />
          </>
        )}

        {onglet === 'contact' && (
          <>
            <Champ label="Téléphone" valeur={brouillon.tel} onChange={set('tel')} />
            <Champ label="WhatsApp" valeur={brouillon.whatsapp} onChange={set('whatsapp')} />
            <Champ label="E-mail" valeur={brouillon.email} onChange={set('email')} />
            <Champ
              label="Site web"
              valeur={brouillon.site_web}
              onChange={set('site_web')}
              erreur={champErreur('site_web')}
            />
            <ZoneTexte
              label="Réseaux sociaux"
              valeur={brouillon.socials}
              onChange={set('socials')}
              lignes={4}
              aide="Une par ligne : plateforme | adresse. Exemple : facebook | https://facebook.com/…"
              erreur={champErreur('socials')}
            />
          </>
        )}

        {onglet === 'tarifs' && (
          <>
            {/*
              L'ONGLET « TARIFS » DE LA FICHE PUBLIQUE N'APPARAÎT QUE SI LES
              DEUX BORNES SONT RENSEIGNÉES. Le dire ici évite de chercher
              pourquoi il manque.
            */}
            <Champ
              label="Budget annuel minimum (MAD)"
              valeur={brouillon.budget_min}
              onChange={set('budget_min')}
              erreur={champErreur('budget_min')}
            />
            <Champ
              label="Budget annuel maximum (MAD)"
              valeur={brouillon.budget_max}
              onChange={set('budget_max')}
              aide="L’onglet « Tarifs » de la fiche n’apparaît que si les deux bornes sont remplies."
              erreur={champErreur('budget_max')}
            />
            <Champ
              label="Gamme affichée"
              valeur={brouillon.gamme_label}
              onChange={set('gamme_label')}
              aide="Par exemple « Milieu de gamme »."
            />
          </>
        )}

        {onglet === 'equipements' && (
          <ZoneTexte
            label="Équipements et services"
            valeur={brouillon.facilites}
            onChange={set('facilites')}
            lignes={9}
            aide="Un par ligne. L’onglet « Équipements » de la fiche n’apparaît que s’il y en a au moins un."
            erreur={champErreur('facilites')}
          />
        )}

        {onglet === 'equipe' && (
          <ZoneTexte
            label="Membres de l’équipe"
            valeur={brouillon.equipe}
            onChange={set('equipe')}
            lignes={9}
            aide="Un par ligne : Nom | Rôle | adresse d’une photo (facultative). Une ligne sans rôle est ignorée."
            erreur={champErreur('equipe')}
          />
        )}

        {onglet === 'faq' && (
          <ZoneTexte
            label="Questions fréquentes"
            valeur={brouillon.faq}
            onChange={set('faq')}
            lignes={9}
            aide="Une par ligne : Question | Réponse. Une ligne sans réponse est ignorée."
            erreur={champErreur('faq')}
          />
        )}

        {onglet === 'plus' && (
          <>
            <ZoneTexte
              label="Chiffres clés"
              valeur={brouillon.chiffres}
              onChange={set('chiffres')}
              lignes={4}
              aide="Un par ligne : Libellé | Valeur. Exemple : Élèves | 420"
              erreur={champErreur('chiffres')}
            />
            <ZoneTexte
              label="Horaires"
              valeur={brouillon.horaires}
              onChange={set('horaires')}
              lignes={4}
              aide="Un par ligne : Libellé | Plage. Exemple : lundi_vendredi | 08:00 – 17:00"
              erreur={champErreur('horaires')}
            />
            <ZoneTexte
              label="Autres projets du propriétaire"
              valeur={brouillon.autres_projets}
              onChange={set('autres_projets')}
              lignes={4}
              aide="Un par ligne : Type | Nom | Ville | Description. Type et nom sont obligatoires."
              erreur={champErreur('autres_projets')}
            />
            <Champ
              label="Vidéo de présentation"
              valeur={brouillon.video_url}
              onChange={set('video_url')}
              aide="Adresse complète de la vidéo."
              erreur={champErreur('video_url')}
            />
          </>
        )}
      </div>

      <div
        style={{
          margin: '18px 0 0',
          padding: '14px 22px',
          borderTop: '1px solid #EAE6DE',
          background: '#FBFAF7',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ font: "400 12.5px/1.5 'Inter', sans-serif", color: '#5A6472', flex: 1 }}>
          Enregistré, ce profil s’applique <strong>immédiatement</strong> à la fiche — sans passer
          par le circuit de validation, qui borne l’établissement et non l’administration (RG20).
        </span>
        <Button type="submit" disabled={envoi.isPending}>
          {envoi.isPending ? 'Enregistrement…' : 'Enregistrer le profil'}
        </Button>
      </div>
    </form>
  );
}

function Encadre({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderRadius: 14,
        padding: '16px 18px',
        font: "400 14px/1.6 'Inter', sans-serif",
        color: '#5A6472',
      }}
    >
      {children}
    </div>
  );
}

/** Les listes deviennent du texte — une entrée par ligne, champs séparés par « | ». */
function versBrouillon(p: ProfilEtablissement) {
  return {
    nom: p.nom ?? '',
    description: p.description ?? '',
    projet_pedagogique: p.projet_pedagogique ?? '',
    adresse: p.adresse ?? '',
    quartier: p.quartier ?? '',
    langues: p.langues ?? '',
    tel: p.tel ?? '',
    whatsapp: p.whatsapp ?? '',
    email: p.email ?? '',
    site_web: p.site_web ?? '',
    budget_min: p.budget_min?.toString() ?? '',
    budget_max: p.budget_max?.toString() ?? '',
    gamme_label: p.gamme_label ?? '',
    video_url: p.video_url ?? '',
    facilites: (p.facilites ?? []).join('\n'),
    equipe: (p.equipe ?? [])
      .map((m) => [m.nom, m.role, m.photo].filter(Boolean).join(' | '))
      .join('\n'),
    faq: (p.faq ?? []).map((item) => `${item.q} | ${item.r}`).join('\n'),
    chiffres: (p.chiffres ?? []).map((c) => `${c.label} | ${c.valeur}`).join('\n'),
    horaires: Object.entries(p.horaires ?? {})
      .map(([cle, valeur]) => `${cle} | ${valeur}`)
      .join('\n'),
    socials: Object.entries(p.socials ?? {})
      .map(([cle, valeur]) => `${cle} | ${valeur}`)
      .join('\n'),
    autres_projets: (p.autres_projets ?? [])
      .map((projet) =>
        [projet.type, projet.nom, projet.ville, projet.description].filter(Boolean).join(' | '),
      )
      .join('\n'),
  };
}

/** Découpe « a | b | c » par ligne, en ignorant les lignes vides. */
const lignes = (texte: string): string[][] =>
  texte
    .split('\n')
    .map((ligne) => ligne.split('|').map((morceau) => morceau.trim()))
    .filter((morceaux) => morceaux.some(Boolean));

/**
 * LE PROFIL ENTIER PART À CHAQUE ENREGISTREMENT, jamais un fragment.
 *
 * Une fusion côté serveur laisserait survivre une rubrique que l'on vient de
 * vider : on croirait avoir retiré un équipement, et il resterait sur le
 * site. Un champ vidé est donc envoyé à `null`, et effacé pour de bon.
 *
 * UNE LIGNE INCOMPLÈTE EST ÉCARTÉE, PAS ENVOYÉE À MOITIÉ. Le DTO exige un nom
 * ET un rôle pour un membre d'équipe : laisser filer une ligne incomplète
 * ferait refuser l'enregistrement ENTIER en 422, et la saisie des autres
 * onglets serait perdue pour un « | » oublié.
 */
function versCharge(b: ReturnType<typeof versBrouillon>): Record<string, unknown> {
  const texte = (valeur: string) => (valeur.trim() === '' ? null : valeur.trim());
  const nombre = (valeur: string) => (valeur.trim() === '' ? null : Number(valeur));
  const objet = (valeur: string) => {
    const entrees = lignes(valeur).filter(([cle, v]) => Boolean(cle) && Boolean(v));

    return entrees.length === 0 ? null : Object.fromEntries(entrees.map(([c, v]) => [c!, v!]));
  };
  const liste = <T,>(valeur: string, vers: (morceaux: string[]) => T | null) => {
    const items = lignes(valeur)
      .map(vers)
      .filter((item): item is T => item !== null);

    return items.length === 0 ? null : items;
  };

  return {
    nom: b.nom.trim(),
    description: texte(b.description),
    projet_pedagogique: texte(b.projet_pedagogique),
    adresse: texte(b.adresse),
    quartier: texte(b.quartier),
    langues: texte(b.langues),
    tel: texte(b.tel),
    whatsapp: texte(b.whatsapp),
    email: texte(b.email),
    site_web: texte(b.site_web),
    budget_min: nombre(b.budget_min),
    budget_max: nombre(b.budget_max),
    gamme_label: texte(b.gamme_label),
    video_url: texte(b.video_url),
    facilites: liste(b.facilites, ([valeur]) => valeur || null),
    equipe: liste(b.equipe, ([nom, role, photo]) =>
      nom && role ? { nom, role, ...(photo ? { photo } : {}) } : null,
    ),
    faq: liste(b.faq, ([q, r]) => (q && r ? { q, r } : null)),
    chiffres: liste(b.chiffres, ([label, valeur]) => (label && valeur ? { label, valeur } : null)),
    horaires: objet(b.horaires),
    socials: objet(b.socials),
    autres_projets: liste(b.autres_projets, ([type, nom, ville, description]) =>
      type && nom
        ? { type, nom, ...(ville ? { ville } : {}), ...(description ? { description } : {}) }
        : null,
    ),
  };
}
