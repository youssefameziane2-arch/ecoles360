import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  ajouterRelance,
  assignerProspect,
  changerStatutProspect,
  chargerCommerciaux,
  chargerIndicateursCrm,
  chargerPipeline,
  LIBELLE_STATUT_PROSPECT,
  TON_STATUT_PROSPECT,
  type Prospect,
  type StatutProspect,
} from '@/api/crm';
import { Badge, Button, EmptyState, Toast } from '@/ds/composants';
import { formaterDate } from '@/lib/formats';
import { lienTelephone } from '@/lib/telephone';

/** Les seuls statuts posables à la main — « transformé » se pose en créant la fiche. */
const TRANSITIONS: StatutProspect[] = ['nouveau', 'a_contacter', 'chaud', 'relance', 'perdu'];

/**
 * Le pipeline commercial — partagé par « CRM Clients » et « Mes leads ».
 *
 * UN SEUL COMPOSANT POUR LES DEUX ÉCRANS parce que c'est la même donnée :
 * le serveur borne au portefeuille selon le rôle de la session. Le front
 * n'envoie aucun filtre de propriété — il ne saurait pas le faire honnêtement,
 * et un filtre côté client ne protège rien.
 *
 * `administration` NE CHANGE PAS CE QU'ON VOIT, seulement ce qu'on peut faire :
 * confier un dossier à un commercial est une décision de la Direction (RG18),
 * puisqu'elle décide qui touchera la commission.
 */
export function PipelineCrm({ administration }: { administration: boolean }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; texte: string } | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);

  const indicateurs = useQuery({ queryKey: ['crm', 'indicateurs'], queryFn: chargerIndicateursCrm });
  const pipeline = useQuery({ queryKey: ['crm', 'pipeline'], queryFn: chargerPipeline });

  const commerciaux = useQuery({
    queryKey: ['admin', 'commerciaux'],
    queryFn: chargerCommerciaux,
    enabled: administration,
  });

  const rafraichir = () => {
    void queryClient.invalidateQueries({ queryKey: ['crm'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'commerciaux'] });
  };

  const action = useMutation({
    mutationFn: (operation: () => Promise<unknown>) => operation(),
    onSuccess: () => {
      setMessage({ tone: 'success', texte: 'Fait.' });
      rafraichir();
    },
    onError: (erreur: unknown) =>
      setMessage({
        tone: 'error',
        texte: erreur instanceof ApiError ? erreur.message : 'L’action a échoué.',
      }),
  });

  const total = pipeline.data?.reduce((somme, colonne) => somme + colonne.prospects.length, 0) ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {message && (
        <Toast
          tone={message.tone}
          title={message.tone === 'success' ? 'Fait' : 'Refusé'}
          message={message.texte}
          onClose={() => setMessage(null)}
        />
      )}

      {indicateurs.data && <Indicateurs valeurs={indicateurs.data} />}

      {pipeline.isPending && <p style={texteDoux}>Chargement…</p>}

      {total === 0 && !pipeline.isPending && (
        <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16 }}>
          <EmptyState
            icon="users"
            title={administration ? 'Aucun prospect' : 'Aucun prospect dans votre portefeuille'}
            description={
              administration
                ? 'Les prospects arrivent du formulaire d’inscription, ou se saisissent à la main.'
                : 'La Direction vous confie les dossiers depuis « CRM Clients ».'
            }
          />
        </div>
      )}

      {pipeline.data
        ?.filter((colonne) => colonne.prospects.length > 0)
        .map((colonne) => (
          <section key={colonne.statut} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span
                aria-hidden
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: TON_STATUT_PROSPECT[colonne.statut],
                  flex: 'none',
                }}
              />
              <h2
                style={{
                  font: "700 15px/1.2 'Inter', sans-serif",
                  color: '#1A1A1A',
                  margin: 0,
                }}
              >
                {LIBELLE_STATUT_PROSPECT[colonne.statut]}
              </h2>
              <span style={{ font: "600 12.5px/1 'Inter', sans-serif", color: '#9AA3AF' }}>
                {colonne.prospects.length}
              </span>
            </div>

            {colonne.prospects.map((prospect) => (
              <CarteProspect
                key={prospect.id}
                prospect={prospect}
                administration={administration}
                commerciaux={commerciaux.data ?? []}
                ouvert={ouvert === prospect.id}
                enCours={action.isPending}
                onBasculer={() => setOuvert(ouvert === prospect.id ? null : prospect.id)}
                onAction={(operation) => action.mutate(operation)}
              />
            ))}
          </section>
        ))}
    </div>
  );
}

function Indicateurs({
  valeurs,
}: {
  valeurs: NonNullable<Awaited<ReturnType<typeof chargerIndicateursCrm>>>;
}) {
  const tuiles = [
    { label: 'En cours', valeur: String(valeurs.en_cours), accent: '#1D3557' },
    { label: 'Transformés', valeur: String(valeurs.transformes), accent: '#1F7A45' },
    {
      label: 'Taux de transformation',
      // SUR LES DOSSIERS CLOS SEULEMENT, et « — » tant qu'il n'y en a aucun :
      // afficher 0 % affirmerait un échec là où il n'y a pas de mesure.
      valeur: valeurs.taux_transformation === null ? '—' : `${valeurs.taux_transformation} %`,
      accent: '#1D3557',
      detail: valeurs.taux_transformation === null ? 'aucun dossier clos' : 'sur dossiers clos',
    },
    {
      label: 'Relances dues',
      valeur: String(valeurs.relances_dues),
      accent: valeurs.relances_dues > 0 ? '#C42B38' : '#9AA3AF',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 12,
      }}
    >
      {tuiles.map((tuile) => (
        <div
          key={tuile.label}
          style={{
            background: '#fff',
            border: '1px solid #EAE6DE',
            borderRadius: 14,
            padding: '14px 16px',
          }}
        >
          <p
            style={{
              font: "600 11.5px/1.3 'Inter', sans-serif",
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              color: '#9AA3AF',
              margin: 0,
            }}
          >
            {tuile.label}
          </p>
          <p
            style={{
              font: "800 23px/1.2 'Inter', sans-serif",
              color: tuile.accent,
              margin: '6px 0 0',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {tuile.valeur}
          </p>
          {tuile.detail && (
            <p style={{ font: "400 11.5px/1.4 'Inter', sans-serif", color: '#9AA3AF', margin: 0 }}>
              {tuile.detail}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function CarteProspect({
  prospect,
  administration,
  commerciaux,
  ouvert,
  enCours,
  onBasculer,
  onAction,
}: {
  prospect: Prospect;
  administration: boolean;
  commerciaux: { id: string; name: string; statut: string }[];
  ouvert: boolean;
  enCours: boolean;
  onBasculer: () => void;
  onAction: (operation: () => Promise<unknown>) => void;
}) {
  const [note, setNote] = useState('');
  const [quand, setQuand] = useState('');

  const transforme = prospect.statut_pipeline === 'transforme';

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderLeft: `4px solid ${TON_STATUT_PROSPECT[prospect.statut_pipeline]}`,
        borderRadius: 13,
        padding: '13px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ font: "700 14.5px/1.2 'Inter', sans-serif", color: '#1A1A1A' }}>
            {prospect.etablissement_nom}
          </div>
          <div style={{ fontSize: 12.5, color: '#5A6472', marginTop: 3 }}>
            {prospect.contact_nom}
            {prospect.contact_fonction && ` · ${prospect.contact_fonction}`}
            {' · '}
            <a href={lienTelephone(prospect.telephone)} style={{ color: '#1D3557', fontWeight: 600 }}>
              {prospect.telephone}
            </a>
          </div>
          <div style={{ fontSize: 12, color: '#9AA3AF', marginTop: 3 }}>
            {prospect.ville && `${prospect.ville} · `}
            {prospect.source} · déposé le {formaterDate(prospect.cree_le)}
            {prospect.commercial && ` · ${prospect.commercial.name}`}
            {!prospect.commercial && ' · non attribué'}
          </div>
        </div>

        {/* Une fiche existe : le dossier est gagné, plus rien à faire avancer. */}
        {transforme && prospect.etablissement && (
          <Badge tone="green">Fiche {prospect.etablissement.statut}</Badge>
        )}

        <Button variant={ouvert ? 'navy' : 'outline'} size="sm" onClick={onBasculer}>
          {ouvert ? 'Replier' : 'Suivre'}
        </Button>
      </div>

      {ouvert && (
        <div
          style={{
            marginTop: 13,
            paddingTop: 12,
            borderTop: '1px solid #F1EEE8',
            display: 'flex',
            flexDirection: 'column',
            gap: 13,
          }}
        >
          {prospect.message && (
            <p style={{ ...texteDoux, fontSize: 13, fontStyle: 'italic' }}>« {prospect.message} »</p>
          )}

          {!transforme && (
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {TRANSITIONS.filter((s) => s !== prospect.statut_pipeline).map((statut) => (
                <Button
                  key={statut}
                  variant="outline"
                  size="sm"
                  disabled={enCours}
                  onClick={() => onAction(() => changerStatutProspect(prospect.id, statut))}
                >
                  → {LIBELLE_STATUT_PROSPECT[statut]}
                </Button>
              ))}
            </div>
          )}

          {/*
            « TRANSFORMÉ » N'EST PAS DANS CETTE LISTE, et l'API le refuse aussi :
            ce statut signifie qu'une fiche existe. On l'obtient en créant la
            fiche de l'établissement, pas en le déclarant.
          */}
          {!transforme && (
            <p style={{ ...texteDoux, fontSize: 12 }}>
              Pour marquer ce dossier gagné, créez la fiche de l’établissement — « transformé » n’est
              pas un statut qu’on pose à la main.
            </p>
          )}

          {administration && (
            <label style={{ display: 'block' }}>
              <span style={etiquette}>Confier à</span>
              <select
                value={prospect.commercial?.id ?? ''}
                disabled={enCours}
                onChange={(evenement) =>
                  onAction(() =>
                    assignerProspect(prospect.id, evenement.target.value || null),
                  )
                }
                style={saisie}
              >
                <option value="">— pot commun, non attribué —</option>
                {commerciaux.map((commercial) => (
                  <option key={commercial.id} value={commercial.id}>
                    {commercial.name}
                    {commercial.statut === 'suspendu' ? ' (suspendu)' : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          {prospect.relances.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {prospect.relances.map((relance) => (
                <div
                  key={relance.id}
                  style={{ font: "400 12.5px/1.5 'Inter', sans-serif", color: '#5A6472' }}
                >
                  {relance.effectuee_le
                    ? `✓ ${formaterDate(relance.effectuee_le)}`
                    : `○ prévue le ${relance.prevue_le ? formaterDate(relance.prevue_le) : '—'}`}
                  {relance.note && ` — ${relance.note}`}
                  {relance.commercial && ` (${relance.commercial.name})`}
                </div>
              ))}
            </div>
          )}

          {!transforme && (
            <form
              onSubmit={(evenement) => {
                evenement.preventDefault();
                onAction(async () => {
                  await ajouterRelance(prospect.id, {
                    note: note.trim() || undefined,
                    prevue_le: quand || undefined,
                    effectuee: !quand,
                  });
                  setNote('');
                  setQuand('');
                });
              }}
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}
            >
              <label style={{ flex: 1, minWidth: 180 }}>
                <span style={etiquette}>Note</span>
                <input
                  value={note}
                  onChange={(evenement) => setNote(evenement.target.value)}
                  placeholder="Ce qui s’est dit, ou ce qu’il faudra dire"
                  style={saisie}
                />
              </label>
              <label>
                <span style={etiquette}>Relancer le</span>
                <input
                  type="date"
                  value={quand}
                  onChange={(evenement) => setQuand(evenement.target.value)}
                  style={{ ...saisie, width: 160 }}
                />
              </label>
              <Button type="submit" size="sm" disabled={enCours}>
                {quand ? 'Programmer' : 'Consigner l’échange'}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};

const etiquette: React.CSSProperties = {
  display: 'block',
  font: "600 12px/1.4 'Inter', sans-serif",
  color: '#5A6472',
  marginBottom: 4,
};

const saisie: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: 38,
  padding: '0 11px',
  font: "400 13.5px/1.5 'Inter', sans-serif",
  color: '#1A1A1A',
  background: '#fff',
  border: '1px solid #E1E5EA',
  borderRadius: 9,
};
