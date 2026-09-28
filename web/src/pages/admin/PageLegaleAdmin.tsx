import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  aCompleter,
  chargerPageLegale,
  publierPageLegale,
  type CleLegale,
  type SectionLegale,
} from '@/api/pages';
import { Badge, Button, Input, Textarea, Toast } from '@/ds/composants';
import { formaterDateHeure } from '@/lib/formats';

type Message = { tone: 'success' | 'error'; texte: string };

/**
 * Onglets « Mentions légales », « Confidentialité » et « Cookies ».
 *
 * ÉDITION EN PLACE, PAS DANS UNE FENÊTRE — contrairement à « À propos ». Une
 * politique de confidentialité fait plusieurs milliers de mots répartis en
 * neuf rubriques ; une modale la donnerait à relire par une meurtrière. Le
 * juriste travaille rubrique par rubrique, à plat.
 *
 * LE SEMIS POSE LE PLAN, JAMAIS LE TEXTE. Ces pages engagent l'éditeur du
 * site devant la loi 09-08 (RG09) : les rédiger à sa place lui ferait prendre
 * des engagements que personne n'a relus. Chaque rubrique arrive donc marquée
 * `[à compléter …]`, et l'écran le signale tant qu'il en reste une.
 */
export function PageLegaleAdmin({ cle }: { cle: CleLegale }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<Message | null>(null);
  const [brouillon, setBrouillon] = useState<SectionLegale[] | null>(null);

  const page = useQuery({ queryKey: ['pages', cle], queryFn: () => chargerPageLegale(cle) });

  /**
   * Le brouillon repart de la page à chaque changement d'onglet.
   *
   * SANS CETTE REMISE À ZÉRO, le composant garde l'état du précédent : on
   * ouvrirait « Cookies » en y voyant les rubriques des mentions légales, et
   * « Publier » les y écrirait pour de bon.
   */
  useEffect(() => {
    setBrouillon(null);
    setMessage(null);
  }, [cle]);

  const publication = useMutation({
    mutationFn: (sections: SectionLegale[]) =>
      publierPageLegale(cle, { titre: page.data?.titre ?? '', sections }),
    onSuccess: () => {
      setMessage({ tone: 'success', texte: 'La page est publiée sur le site.' });
      setBrouillon(null);
      void queryClient.invalidateQueries({ queryKey: ['pages', cle] });
    },
    onError: (erreur) =>
      setMessage({
        tone: 'error',
        texte: erreur instanceof ApiError ? erreur.message : 'La page n’a pas pu être publiée.',
      }),
  });

  if (page.isPending) return <p style={texteDoux}>Chargement…</p>;

  if (page.isError) {
    return <p style={{ ...texteDoux, color: '#E63946' }}>Cette page n’a pas pu être chargée.</p>;
  }

  const sections = brouillon ?? page.data.blocs.sections ?? [];
  const modifie = brouillon !== null;

  const majSection = (rang: number, champ: keyof SectionLegale, valeur: string) =>
    setBrouillon(sections.map((s, i) => (i === rang ? { ...s, [champ]: valeur } : s)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 860 }}>
      {message && (
        <Toast
          tone={message.tone}
          title={message.tone === 'success' ? 'Publié' : 'Refusé'}
          message={message.texte}
          onClose={() => setMessage(null)}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ font: "700 16px/1.3 'Inter', sans-serif", color: '#1A1A1A' }}>
          {page.data.titre}
        </span>

        {aCompleter(page.data) ? (
          <Badge tone="amber">À compléter</Badge>
        ) : (
          <Badge tone="green">Rédigée</Badge>
        )}

        <span style={{ flex: 1 }} />

        {page.data.modifiee_le && (
          <span style={{ font: "400 12.5px/1.4 'Inter', sans-serif", color: '#9AA3AF' }}>
            Publiée le {formaterDateHeure(page.data.modifiee_le)}
          </span>
        )}
      </div>

      {aCompleter(page.data) && (
        <p style={avertissement}>
          Cette page est <strong>en ligne</strong> avec son plan de rubriques et des mentions
          « à compléter ». La loi 09-08 l’exige d’un site qui recueille les coordonnées de
          parents : son texte engage l’éditeur du site et doit être rédigé ou relu par un
          juriste avant l’ouverture au public.
        </p>
      )}

      {sections.map((section, rang) => (
        <div
          key={rang}
          style={{
            background: '#fff',
            border: '1px solid #EAE6DE',
            borderRadius: 14,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                label={`Rubrique ${rang + 1}`}
                value={section.titre}
                onChange={(evenement) => majSection(rang, 'titre', evenement.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBrouillon(sections.filter((_, i) => i !== rang))}
            >
              Retirer
            </Button>
          </div>

          <Textarea
            label="Texte"
            rows={7}
            value={section.corps}
            onChange={(evenement) => majSection(rang, 'corps', evenement.target.value)}
          />
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button
          variant="outline"
          onClick={() => setBrouillon([...sections, { titre: '', corps: '' }])}
        >
          Ajouter une rubrique
        </Button>

        <span style={{ flex: 1 }} />

        {modifie && (
          <Button variant="outline" onClick={() => setBrouillon(null)}>
            Annuler
          </Button>
        )}

        <Button
          disabled={!modifie || publication.isPending}
          onClick={() => publication.mutate(sections)}
        >
          {publication.isPending ? 'Publication…' : 'Publier sur le site'}
        </Button>
      </div>

      <p style={{ ...texteDoux, fontSize: 12.5 }}>
        « Publier » remplace la page entière : une rubrique retirée ici disparaît du site. Le
        journal d’audit garde le texte d’avant et d’après (RG15) — c’est lui qui dira, le jour
        où on le demandera, ce que cette page affichait à telle date.
      </p>
    </div>
  );
}

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};

const avertissement: React.CSSProperties = {
  font: "400 13px/1.6 'Inter', sans-serif",
  color: '#8A5A00',
  background: '#FFF8E6',
  border: '1px solid #F5E2B0',
  borderRadius: 12,
  padding: '11px 14px',
  margin: 0,
};
