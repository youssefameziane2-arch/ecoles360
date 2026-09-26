import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  arreterSponsoring,
  chargerSponsorings,
  creerSponsoring,
  estActive,
  LIBELLE_NIVEAU,
  TON_NIVEAU,
  type NiveauSponsoring,
  type Sponsoring,
} from '@/api/sponsorings';
import { chargerEtablissementsAdmin } from '@/api/admin';
import { chargerVilles, LIBELLE_TYPE, type TypeEtablissement } from '@/api/etablissements';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { Badge, Button, EmptyState, Toast } from '@/ds/composants';
import { formaterDate, formaterMad } from '@/lib/formats';
import { useTitrePage } from '@/lib/titre';

const NIVEAUX: NiveauSponsoring[] = ['premium', 'gold', 'silver'];
const TYPES = Object.keys(LIBELLE_TYPE) as TypeEtablissement[];

/**
 * Campagnes de sponsoring — RG19.
 *
 * ÉCRAN DESSINÉ SANS RÉFÉRENCE : la maquette n'en contient pas. Elle réduit
 * RG19 à une bascule « mis en avant » sur la liste des établissements, ce
 * qu'un sponsoring vendu par niveau, périmètre et période ne peut pas être.
 * L'écran reprend donc les conventions des autres — mêmes cartes, mêmes
 * chips, même filet.
 */
export function SponsoringsAdmin() {
  useTitrePage('Campagnes de sponsoring');

  return (
    <AvecIdentite
      role={['superadmin']}
      rendu={(identite) => (
        <CoquilleEspace
          identite={identite}
          titre="Campagnes de sponsoring"
          sousTitre="Niveau, périmètre et période — rotation équitable à niveau égal"
        >
          <Contenu />
        </CoquilleEspace>
      )}
    />
  );
}

function Contenu() {
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; texte: string } | null>(null);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  const campagnes = useQuery({ queryKey: ['admin', 'sponsorings'], queryFn: chargerSponsorings });

  const actives = campagnes.data?.filter(estActive) ?? [];
  const terminees = campagnes.data?.filter((campagne) => !estActive(campagne)) ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 900 }}>
      {message && (
        <Toast
          tone={message.tone}
          title={message.tone === 'success' ? 'Fait' : 'Refusé'}
          message={message.texte}
          onClose={() => setMessage(null)}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <p style={{ ...texteDoux, flex: 1, minWidth: 260 }}>
          Une campagne met une fiche en tête des recherches de son périmètre. À niveau égal,
          l’ordre tourne chaque jour : personne n’est durablement premier.
        </p>
        <Button variant="primary" size="md" onClick={() => setFormulaireOuvert((v) => !v)}>
          {formulaireOuvert ? 'Fermer' : '+ Nouvelle campagne'}
        </Button>
      </div>

      {formulaireOuvert && (
        <Formulaire
          onCree={() => {
            setFormulaireOuvert(false);
            setMessage({ tone: 'success', texte: 'Campagne ouverte.' });
          }}
          onErreur={(texte) => setMessage({ tone: 'error', texte })}
        />
      )}

      {campagnes.isPending && <p style={texteDoux}>Chargement…</p>}

      {campagnes.data?.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16 }}>
          <EmptyState
            icon="star"
            title="Aucune campagne"
            description="Ouvrez une campagne pour mettre un établissement en avant sur un périmètre et une période."
          />
        </div>
      )}

      {actives.length > 0 && (
        <Section titre={`En cours (${actives.length})`}>
          {actives.map((campagne) => (
            <LigneCampagne key={campagne.id} campagne={campagne} onMessage={setMessage} active />
          ))}
        </Section>
      )}

      {terminees.length > 0 && (
        <Section titre={`Terminées ou à venir (${terminees.length})`}>
          {terminees.map((campagne) => (
            <LigneCampagne key={campagne.id} campagne={campagne} onMessage={setMessage} />
          ))}
        </Section>
      )}
    </div>
  );
}

function LigneCampagne({
  campagne,
  active,
  onMessage,
}: {
  campagne: Sponsoring;
  active?: boolean;
  onMessage: (message: { tone: 'success' | 'error'; texte: string }) => void;
}) {
  const queryClient = useQueryClient();

  const arret = useMutation({
    mutationFn: () => arreterSponsoring(campagne.id),
    onSuccess: () => {
      onMessage({ tone: 'success', texte: `Campagne de « ${campagne.etablissement.nom} » arrêtée.` });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sponsorings'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'etablissements'] });
    },
    onError: (erreur: unknown) => {
      onMessage({
        tone: 'error',
        texte: erreur instanceof ApiError ? erreur.message : 'L’arrêt a échoué.',
      });
    },
  });

  const portee = [
    campagne.ville ? campagne.ville.nom : 'Toutes les villes',
    campagne.categorie ? LIBELLE_TYPE[campagne.categorie] : 'Tous les types',
    campagne.mot_cle ? `mot-clé « ${campagne.mot_cle} »` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '13px 0',
        borderBottom: '1px solid #F1ECE3',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14.5, fontWeight: 700 }}>{campagne.etablissement.nom}</span>
          <Badge tone={TON_NIVEAU[campagne.niveau]}>{LIBELLE_NIVEAU[campagne.niveau]}</Badge>
        </div>
        <div style={{ fontSize: 12.5, color: '#9AA3AF', marginTop: 4 }}>{portee}</div>
        <div style={{ fontSize: 12.5, color: '#5A6472', marginTop: 3 }}>
          Du {formaterDate(campagne.debut)} au {formaterDate(campagne.fin)} ·{' '}
          {formaterMad(campagne.tarif_mad)}
        </div>
      </div>

      {active && (
        <Button variant="outline" size="sm" disabled={arret.isPending} onClick={() => arret.mutate()}>
          {arret.isPending ? 'Arrêt…' : 'Arrêter'}
        </Button>
      )}
    </div>
  );
}

function Formulaire({
  onCree,
  onErreur,
}: {
  onCree: () => void;
  onErreur: (texte: string) => void;
}) {
  const queryClient = useQueryClient();
  const aujourdhui = new Date().toISOString().slice(0, 10);

  const [etablissementId, setEtablissementId] = useState('');
  const [niveau, setNiveau] = useState<NiveauSponsoring>('premium');
  const [villeId, setVilleId] = useState('');
  const [categorie, setCategorie] = useState('');
  const [motCle, setMotCle] = useState('');
  const [debut, setDebut] = useState(aujourdhui);
  const [fin, setFin] = useState('');
  const [tarif, setTarif] = useState('');

  const etablissements = useQuery({
    queryKey: ['admin', 'etablissements', 'validee', undefined],
    queryFn: () => chargerEtablissementsAdmin({ statut: 'validee' }),
  });
  const villes = useQuery({ queryKey: ['villes'], queryFn: chargerVilles });

  const creation = useMutation({
    mutationFn: () =>
      creerSponsoring({
        etablissement_id: Number(etablissementId),
        niveau,
        ville_id: villeId ? Number(villeId) : undefined,
        categorie: categorie ? (categorie as TypeEtablissement) : undefined,
        mot_cle: motCle || undefined,
        debut,
        fin,
        tarif_mad: Number(tarif),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sponsorings'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'etablissements'] });
      onCree();
    },
    onError: (erreur: unknown) => {
      onErreur(erreur instanceof ApiError ? erreur.message : 'La création a échoué.');
    },
  });

  return (
    <form
      onSubmit={(evenement) => {
        evenement.preventDefault();
        creation.mutate();
      }}
      style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 14, padding: 20 }}
    >
      <div className="e-form-grille">
        <Selecteur
          label="Établissement"
          valeur={etablissementId}
          onChange={setEtablissementId}
          requis
          options={(etablissements.data ?? []).map((e) => ({ valeur: e.id, libelle: e.nom }))}
          placeholder="Choisir un établissement"
        />

        <Selecteur
          label="Niveau"
          valeur={niveau}
          onChange={(valeur) => setNiveau(valeur as NiveauSponsoring)}
          requis
          options={NIVEAUX.map((n) => ({ valeur: n, libelle: LIBELLE_NIVEAU[n] }))}
        />

        <Selecteur
          label="Ville"
          valeur={villeId}
          onChange={setVilleId}
          options={(villes.data ?? []).map((v) => ({ valeur: v.id, libelle: v.nom }))}
          placeholder="Toutes les villes"
        />

        <Selecteur
          label="Type d’établissement"
          valeur={categorie}
          onChange={setCategorie}
          options={TYPES.map((t) => ({ valeur: t, libelle: LIBELLE_TYPE[t] }))}
          placeholder="Tous les types"
        />

        <ChampTexte
          label="Mot-clé"
          valeur={motCle}
          onChange={setMotCle}
          aide="La campagne ne joue que si la recherche contient ce mot."
        />

        <ChampTexte label="Tarif (MAD)" valeur={tarif} onChange={setTarif} requis type="number" />

        <ChampTexte label="Début" valeur={debut} onChange={setDebut} requis type="date" />
        <ChampTexte label="Fin" valeur={fin} onChange={setFin} requis type="date" />
      </div>

      <div style={{ marginTop: 16 }}>
        <Button
          variant="primary"
          size="md"
          type="submit"
          disabled={!etablissementId || !fin || !tarif || creation.isPending}
        >
          {creation.isPending ? 'Création…' : 'Ouvrir la campagne'}
        </Button>
      </div>
    </form>
  );
}

function Selecteur({
  label,
  valeur,
  onChange,
  options,
  placeholder,
  requis,
}: {
  label: string;
  valeur: string;
  onChange: (valeur: string) => void;
  options: { valeur: string; libelle: string }[];
  placeholder?: string;
  requis?: boolean;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={etiquette}>
        {label} {requis && <span style={{ color: '#E63946' }}>*</span>}
      </span>
      <select
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value)}
        required={requis}
        style={controle}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.valeur} value={option.valeur}>
            {option.libelle}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChampTexte({
  label,
  valeur,
  onChange,
  type = 'text',
  requis,
  aide,
}: {
  label: string;
  valeur: string;
  onChange: (valeur: string) => void;
  type?: string;
  requis?: boolean;
  aide?: string;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={etiquette}>
        {label} {requis && <span style={{ color: '#E63946' }}>*</span>}
      </span>
      <input
        type={type}
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value)}
        required={requis}
        style={controle}
      />
      {aide && (
        <span style={{ display: 'block', fontSize: 12, color: '#9AA3AF', marginTop: 4 }}>{aide}</span>
      )}
    </label>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{titre}</div>
      {children}
    </section>
  );
}

const etiquette: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#2A313B',
  marginBottom: 6,
};

const controle: React.CSSProperties = {
  width: '100%',
  height: 42,
  padding: '0 12px',
  border: '1px solid #E1E5EA',
  borderRadius: 10,
  fontFamily: 'inherit',
  fontSize: 14,
  background: '#fff',
  color: '#1A1A1A',
};

const texteDoux: React.CSSProperties = {
  font: "400 13.5px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
