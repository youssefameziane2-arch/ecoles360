import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  chargerCommissions,
  chargerIndicateursCrm,
  chargerRelancesDues,
  effectuerRelance,
  LIBELLE_STATUT_PROSPECT,
  type CommissionCrm,
  type StatutCommission,
} from '@/api/crm';
import { CalendrierRelances, cleLocale } from '@/components/CalendrierRelances';
import { AvecIdentite, CoquilleEspace } from '@/components/CoquilleEspace';
import { PipelineCrm } from '@/components/PipelineCrm';
import { Badge, Button, EmptyState } from '@/ds/composants';
import { formaterDate, formaterMad } from '@/lib/formats';
import { lienTelephone } from '@/lib/telephone';
import { useTitrePage } from '@/lib/titre';

const LIBELLE_COMMISSION: Record<StatutCommission, string> = {
  a_valider: 'À valider par la Direction',
  validee: 'Validée',
  reglee: 'Réglée',
};

const TON_COMMISSION: Record<StatutCommission, 'amber' | 'green' | 'grey'> = {
  a_valider: 'amber',
  validee: 'green',
  reglee: 'grey',
};

/**
 * Coquille commune aux écrans du commercial.
 *
 * LE SERVEUR BORNE AU PORTEFEUILLE, pas ces écrans. Ils appellent les mêmes
 * routes que l'administration ; c'est le rôle de la session qui décide de ce
 * qui revient. Filtrer côté client ne protégerait rien et donnerait l'illusion
 * que c'est fait.
 */
function Ecran({
  titre,
  sousTitre,
  children,
}: {
  titre: string;
  sousTitre: string;
  children: React.ReactNode;
}) {
  useTitrePage(titre);

  return (
    <AvecIdentite
      role={['commercial']}
      rendu={(identite) => (
        <CoquilleEspace identite={identite} titre={titre} sousTitre={sousTitre}>
          {children}
        </CoquilleEspace>
      )}
    />
  );
}

/** Mes leads — écran `isCrm` de la maquette, côté commercial. */
export function LeadsCommercial() {
  return (
    <Ecran titre="Mes leads" sousTitre="Les établissements que vous démarchez">
      <PipelineCrm administration={false} />
    </Ecran>
  );
}

/**
 * Agenda & tâches — les relances programmées.
 *
 * UNE RELANCE EST « DUE » QUAND ELLE EST PROGRAMMÉE, PAS ENCORE FAITE, ET QUE
 * SA DATE EST PASSÉE. Les trois conditions comptent : sans la première, toute
 * note deviendrait une tâche ; sans la dernière, l'agenda afficherait des
 * rendez-vous du mois prochain comme du retard.
 */
export function AgendaCommercial() {
  return (
    <Ecran titre="Agenda & tâches" sousTitre="Vos relances à faire, les plus anciennes d’abord">
      <Agenda />
    </Ecran>
  );
}

function Agenda() {
  const queryClient = useQueryClient();
  const relances = useQuery({ queryKey: ['crm', 'relances'], queryFn: chargerRelancesDues });
  const [jour, setJour] = useState<string | null>(null);

  const fait = useMutation({
    mutationFn: (id: string) => effectuerRelance(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['crm'] }),
  });

  if (relances.isPending) return <p style={texteDoux}>Chargement…</p>;

  const toutes = relances.data ?? [];

  if (toutes.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16 }}>
        <EmptyState
          icon="check-circle"
          title="Rien à relancer"
          description="Les relances que vous programmez depuis « Mes leads » apparaissent ici le jour venu."
        />
      </div>
    );
  }

  const aujourdhui = Date.now();
  const visibles = jour
    ? toutes.filter((relance) => cleLocale(new Date(relance.prevue_le)) === jour)
    : toutes;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <CalendrierRelances
        dates={toutes.map((relance) => relance.prevue_le)}
        jourSelectionne={jour}
        onJour={setJour}
      />

      {/*
        UN JOUR SANS RELANCE EST UN CAS NORMAL, pas une erreur : on clique un
        mardi pour vérifier qu'il est libre. L'écran le dit plutôt que de
        n'afficher qu'une liste vide.
      */}
      {visibles.length === 0 && (
        <p style={texteDoux}>Aucune relance ce jour-là.</p>
      )}

      {visibles.map((relance) => {
        const enRetard = new Date(relance.prevue_le).getTime() < aujourdhui;

        return (
          <div
            key={relance.id}
            style={{
              background: '#fff',
              border: '1px solid #EAE6DE',
              borderLeft: `4px solid ${enRetard ? '#C42B38' : '#E9A23B'}`,
              borderRadius: 13,
              padding: '13px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ font: "700 14.5px/1.2 'Inter', sans-serif" }}>
                {relance.prospect.etablissement_nom}
              </div>
              <div style={{ fontSize: 12.5, color: '#5A6472', marginTop: 3 }}>
                {relance.prospect.contact_nom} ·{' '}
                <a
                  href={lienTelephone(relance.prospect.telephone)}
                  style={{ color: '#1D3557', fontWeight: 600 }}
                >
                  {relance.prospect.telephone}
                </a>
              </div>
              {relance.note && (
                <div style={{ fontSize: 12.5, color: '#5A6472', marginTop: 3, fontStyle: 'italic' }}>
                  {relance.note}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  font: "600 12.5px/1.3 'Inter', sans-serif",
                  color: enRetard ? '#C42B38' : '#B57708',
                }}
              >
                {enRetard ? 'En retard depuis le' : 'Prévue le'} {formaterDate(relance.prevue_le)}
              </div>
              <div style={{ fontSize: 12, color: '#9AA3AF', marginTop: 2 }}>
                {LIBELLE_STATUT_PROSPECT[relance.prospect.statut_pipeline]}
              </div>
            </div>

            <Button
              variant="success"
              size="sm"
              disabled={fait.isPending}
              onClick={() => fait.mutate(relance.id)}
            >
              C’est fait
            </Button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Transferts & commissions — RG18.
 *
 * UNE COMMISSION NAÎT « À VALIDER » À L'ÉMISSION DE LA FACTURE, pas à son
 * encaissement, et n'est réglée qu'après validation de la Direction. L'écran
 * le dit, parce qu'un commercial qui verrait un montant sans ce détail le
 * croirait acquis.
 */
export function TransfertsCommercial() {
  return (
    <Ecran titre="Transferts & commissions" sousTitre="Ce que vos dossiers ont généré">
      <Commissions />
    </Ecran>
  );
}

function Commissions() {
  const indicateurs = useQuery({ queryKey: ['crm', 'indicateurs'], queryFn: chargerIndicateursCrm });
  const commissions = useQuery({ queryKey: ['crm', 'commissions'], queryFn: chargerCommissions });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {indicateurs.data && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          {(
            [
              ['À valider', indicateurs.data.commissions_a_valider, '#B57708'],
              ['Validées', indicateurs.data.commissions_validees, '#1F7A45'],
              ['Réglées', indicateurs.data.commissions_reglees, '#5A6472'],
            ] as const
          ).map(([label, montant, accent]) => (
            <div
              key={label}
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
                {label}
              </p>
              <p
                style={{
                  font: "800 22px/1.2 'Inter', sans-serif",
                  color: accent,
                  margin: '6px 0 0',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formaterMad(Number(montant))}
              </p>
            </div>
          ))}
        </div>
      )}

      {commissions.data?.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 16 }}>
          <EmptyState
            icon="award"
            title="Aucune commission"
            description="Une commission naît quand une facture est émise sur un dossier que vous avez apporté, et si la Direction a fixé un taux."
          />
        </div>
      )}

      {commissions.data?.map((commission) => (
        <LigneCommission key={commission.id} commission={commission} />
      ))}

      <p style={{ ...texteDoux, fontSize: 12.5 }}>
        Une commission naît <strong>à l’émission de la facture</strong>, en « à valider ». Elle
        n’est réglée qu’après validation de la Direction (RG18) — un montant affiché ici n’est donc
        pas encore un montant perçu.
      </p>
    </div>
  );
}

function LigneCommission({ commission }: { commission: CommissionCrm }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EAE6DE',
        borderRadius: 13,
        padding: '13px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ font: "700 14.5px/1.2 'Inter', sans-serif" }}>
          {commission.facture.etablissement.nom}
        </div>
        <div style={{ fontSize: 12.5, color: '#9AA3AF', marginTop: 3 }}>
          Facture {commission.facture.numero} · {formaterDate(commission.facture.emise_le)} ·{' '}
          {formaterMad(Number(commission.facture.total_ttc))} TTC
          {commission.facture.statut_paiement === 'non_payee' && ' · non encaissée'}
        </div>
      </div>

      <Badge tone={TON_COMMISSION[commission.statut]}>
        {LIBELLE_COMMISSION[commission.statut]}
      </Badge>

      <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        <div style={{ font: "800 18px/1.2 'Inter', sans-serif", color: '#1D3557' }}>
          {formaterMad(Number(commission.montant_mad))}
        </div>
        <div style={{ fontSize: 12, color: '#9AA3AF' }}>{commission.taux_pct} %</div>
      </div>
    </div>
  );
}

/** Tableau de bord — la vue d'ensemble d'un commercial. */
export function TableauDeBordCommercial() {
  return (
    <Ecran titre="Tableau de bord" sousTitre="Votre portefeuille en un coup d’œil">
      <PipelineCrm administration={false} />
    </Ecran>
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
