import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  chargerProfilEtablissement,
  ecrireProfilEtablissement,
  type ProfilEtablissement,
} from '@/api/admin';
import { Champ, ZoneTexte } from '@/components/Champs';
import { ListeEditable } from '@/components/ListeEditable';
import { Button, Tabs, Toast } from '@/ds/composants';
import { RESEAUX_SOCIAUX } from '@/lib/liens';

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

  const setListe = (champ: keyof typeof brouillon, valeurs: Record<string, string>[]) =>
    setBrouillon((actuel) => ({ ...actuel, [champ]: valeurs }));

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
            <ListeEditable
              titre="Réseaux sociaux"
              libelleAjout="+ Ajouter un réseau"
              colonnes={[
                {
                  cle: 'cle',
                  label: 'Plateforme',
                  requise: true,
                  aide: 'Choisir une plateforme…',
                  // La liste fermée que l'API accepte — un nom libre y serait
                  // refusé en 422.
                  options: RESEAUX_SOCIAUX,
                },
                {
                  cle: 'valeur',
                  label: 'Adresse',
                  requise: true,
                  aide: 'https://facebook.com/…',
                },
              ]}
              valeurs={brouillon.socials}
              onChange={(valeurs) => setListe('socials', valeurs)}
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
          <ListeEditable
            titre="Membres de l’équipe"
            aide="L’onglet « Équipe » de la fiche n’apparaît que s’il y a au moins un membre."
            libelleAjout="+ Ajouter un membre"
            colonnes={[
              { cle: 'nom', label: 'Nom', requise: true, aide: 'Nadia Bennis' },
              { cle: 'role', label: 'Rôle', requise: true, aide: 'Directrice' },
              { cle: 'photo', label: 'Photo (adresse, facultative)' },
            ]}
            valeurs={brouillon.equipe}
            onChange={(valeurs) => setListe('equipe', valeurs)}
          />
        )}

        {onglet === 'faq' && (
          <ListeEditable
            titre="Questions fréquentes"
            aide="L’onglet « FAQ » de la fiche n’apparaît que s’il y a au moins une question."
            libelleAjout="+ Ajouter une question"
            colonnes={[
              { cle: 'q', label: 'Question', requise: true, aide: 'Quels sont les horaires ?' },
              { cle: 'r', label: 'Réponse', requise: true, lignes: 3 },
            ]}
            valeurs={brouillon.faq}
            onChange={(valeurs) => setListe('faq', valeurs)}
          />
        )}

        {onglet === 'plus' && (
          <>
            <ListeEditable
              titre="Chiffres clés"
              aide="Affichés dans l’onglet « À propos » de la fiche."
              libelleAjout="+ Ajouter un chiffre"
              colonnes={[
                { cle: 'label', label: 'Libellé', requise: true, aide: 'Élèves' },
                { cle: 'valeur', label: 'Valeur', requise: true, aide: '420' },
              ]}
              valeurs={brouillon.chiffres}
              onChange={(valeurs) => setListe('chiffres', valeurs)}
            />

            <ListeEditable
              titre="Horaires"
              libelleAjout="+ Ajouter un horaire"
              colonnes={[
                { cle: 'cle', label: 'Libellé', requise: true, aide: 'Lundi au vendredi' },
                { cle: 'valeur', label: 'Plage', requise: true, aide: '08:00 – 17:00' },
              ]}
              valeurs={brouillon.horaires}
              onChange={(valeurs) => setListe('horaires', valeurs)}
            />

            <ListeEditable
              titre="Autres projets du propriétaire"
              libelleAjout="+ Ajouter un projet"
              colonnes={[
                { cle: 'type', label: 'Type', requise: true, aide: 'Restaurant' },
                { cle: 'nom', label: 'Nom', requise: true, aide: 'Le Riad Gourmand' },
                { cle: 'ville', label: 'Ville', aide: 'Casablanca · Maârif' },
                { cle: 'description', label: 'Description', lignes: 2 },
              ]}
              valeurs={brouillon.autres_projets}
              onChange={(valeurs) => setListe('autres_projets', valeurs)}
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

/**
 * Le profil devient un brouillon éditable.
 *
 * LES LISTES SONT DES TABLEAUX DE CHAMPS, plus des lignes de texte séparées
 * par « | ». Cette syntaxe-là a fait perdre des saisies en silence : une
 * question tapée sans barre verticale était écartée, et l'écran annonçait
 * « Enregistré ». Voir `ListeEditable`.
 */
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
    // Liste de valeurs simples : une par ligne reste le plus rapide à saisir,
    // et rien ne peut y être perdu faute de séparateur.
    facilites: (p.facilites ?? []).join('\n'),
    equipe: (p.equipe ?? []).map((m) => ({ nom: m.nom, role: m.role, photo: m.photo ?? '' })),
    faq: (p.faq ?? []).map((item) => ({ q: item.q, r: item.r })),
    chiffres: (p.chiffres ?? []).map((c) => ({ label: c.label, valeur: c.valeur })),
    horaires: Object.entries(p.horaires ?? {}).map(([cle, valeur]) => ({ cle, valeur })),
    socials: Object.entries(p.socials ?? {}).map(([cle, valeur]) => ({ cle, valeur })),
    autres_projets: (p.autres_projets ?? []).map((projet) => ({
      type: projet.type,
      nom: projet.nom,
      ville: projet.ville ?? '',
      description: projet.description ?? '',
    })),
  };
}

type Ligne = Record<string, string>;

/** Garde les lignes dont tous les champs exigés sont remplis. */
const completes = (lignes: Ligne[], requis: string[]): Ligne[] =>
  lignes.filter((ligne) => requis.every((cle) => (ligne[cle] ?? '').trim() !== ''));

/** `null` plutôt qu'un tableau vide : la rubrique disparaît alors de la fiche. */
const ouRien = <T,>(items: T[]): T[] | null => (items.length === 0 ? null : items);

/**
 * LE PROFIL ENTIER PART À CHAQUE ENREGISTREMENT, jamais un fragment.
 *
 * Une fusion côté serveur laisserait survivre une rubrique que l'on vient de
 * vider : on croirait avoir retiré un équipement, et il resterait sur le
 * site. Un champ vidé est donc envoyé à `null`, et effacé pour de bon.
 *
 * UNE LIGNE INCOMPLÈTE EST ÉCARTÉE — mais elle est désormais SIGNALÉE À
 * L'ÉCRAN avant l'envoi (`ListeEditable`), et c'est toute la différence. Le
 * DTO exige un nom ET un rôle pour un membre d'équipe : envoyer la moitié
 * ferait refuser l'enregistrement entier en 422, et la saisie des autres
 * onglets serait perdue. L'écarter en silence, comme on le faisait, perdait
 * la saisie tout autant — sans même le dire.
 */
function versCharge(b: ReturnType<typeof versBrouillon>): Record<string, unknown> {
  const texte = (valeur: string) => (valeur.trim() === '' ? null : valeur.trim());
  const nombre = (valeur: string) => (valeur.trim() === '' ? null : Number(valeur));

  const paires = (lignes: { cle: string; valeur: string }[]) => {
    const gardees = completes(lignes as unknown as Ligne[], ['cle', 'valeur']);

    return gardees.length === 0
      ? null
      : Object.fromEntries(gardees.map((l) => [l.cle!.trim(), l.valeur!.trim()]));
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

    facilites: ouRien(
      b.facilites
        .split('\n')
        .map((ligne) => ligne.trim())
        .filter(Boolean),
    ),

    equipe: ouRien(
      completes(b.equipe as unknown as Ligne[], ['nom', 'role']).map((m) => ({
        nom: m.nom!.trim(),
        role: m.role!.trim(),
        ...(m.photo?.trim() ? { photo: m.photo.trim() } : {}),
      })),
    ),

    faq: ouRien(
      completes(b.faq as unknown as Ligne[], ['q', 'r']).map((item) => ({
        q: item.q!.trim(),
        r: item.r!.trim(),
      })),
    ),

    chiffres: ouRien(
      completes(b.chiffres as unknown as Ligne[], ['label', 'valeur']).map((c) => ({
        label: c.label!.trim(),
        valeur: c.valeur!.trim(),
      })),
    ),

    horaires: paires(b.horaires),
    socials: paires(b.socials),

    autres_projets: ouRien(
      completes(b.autres_projets as unknown as Ligne[], ['type', 'nom']).map((projet) => ({
        type: projet.type!.trim(),
        nom: projet.nom!.trim(),
        ...(projet.ville?.trim() ? { ville: projet.ville.trim() } : {}),
        ...(projet.description?.trim() ? { description: projet.description.trim() } : {}),
      })),
    ),
  };
}
