import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import {
  chargerPageAPropos,
  paragraphes,
  publierPageAPropos,
  type BlocsAPropos,
  type PageAPropos,
} from '@/api/pages';
import { Button, Input, Modal, Textarea, Toast } from '@/ds/composants';
import { formaterDateHeure } from '@/lib/formats';

type Message = { tone: 'success' | 'error'; texte: string };

/**
 * Onglet « Page À propos » de « Contenu du site » — maquette `isAdminContent`.
 *
 * LECTURE D'ABORD, ÉDITION DANS UNE FENÊTRE, comme la maquette : la carte
 * montre ce que le site affiche, « Modifier le contenu » ouvre le formulaire,
 * « Publier » l'envoie. Le formulaire porte la page entière — l'API la
 * remplace d'un bloc, et journalise l'avant et l'après (RG15).
 *
 * La maquette n'édite que l'histoire, la mission, trois valeurs et les
 * coordonnées. Le titre principal, les engagements et l'équipe s'y ajoutent :
 * ce sont désormais des blocs de la page, et un bloc qu'on ne peut pas
 * modifier depuis l'administration redevient du texte en dur.
 */
export function PageAProposAdmin() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<Message | null>(null);
  const [edition, setEdition] = useState<BlocsAPropos | null>(null);

  // Même clé que la page publique : publier rafraîchit les deux.
  const page = useQuery({ queryKey: ['pages', 'a-propos'], queryFn: chargerPageAPropos });

  const publication = useMutation({
    mutationFn: (blocs: BlocsAPropos) =>
      publierPageAPropos({ titre: page.data?.titre ?? 'À propos', blocs }),
    onSuccess: () => {
      setMessage({ tone: 'success', texte: 'La page « À propos » est publiée sur le site.' });
      setEdition(null);
      void queryClient.invalidateQueries({ queryKey: ['pages', 'a-propos'] });
    },
    onError: (erreur) =>
      setMessage({
        tone: 'error',
        texte: erreur instanceof ApiError ? erreur.message : 'La page n’a pas pu être publiée.',
      }),
  });

  if (page.isPending) {
    return <p style={texteDoux}>Chargement…</p>;
  }

  if (page.isError) {
    return <p style={{ ...texteDoux, color: '#E63946' }}>La page « À propos » n’a pas pu être chargée.</p>;
  }

  const b = page.data.blocs;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 860 }}>
      {message && (
        <Toast
          tone={message.tone}
          title={message.tone === 'success' ? 'Publié' : 'Refusé'}
          message={message.texte}
          onClose={() => setMessage(null)}
        />
      )}

      <section style={carte}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Page « À propos »</div>
            <div style={{ fontSize: 12.5, color: '#9AA3AF', marginTop: 2 }}>
              Contenu piloté depuis l’administration — reflété sur le site public
              {page.data.modifiee_le && ` · publié le ${formaterDateHeure(page.data.modifiee_le)}`}
            </div>
          </div>
          <Button variant="navy" size="sm" onClick={() => setEdition(versFormulaire(page.data))}>
            Modifier le contenu
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Lecture libelle="Titre principal" valeur={b.accroche} />
          <Lecture libelle="Notre histoire" valeur={paragraphes(b.histoire).join('\n\n')} />
          <Lecture libelle="Mission" valeur={b.mission} />

          <Liste
            libelle="Valeurs"
            elements={(b.valeurs ?? []).map((valeur) => ({ titre: valeur.titre, texte: valeur.texte }))}
            vide="Aucune valeur — la section est masquée sur le site."
          />
          <Liste
            libelle="Engagements"
            elements={(b.engagements ?? []).map((engagement) => ({
              titre: engagement.titre,
              texte: paragraphes(engagement.texte)[0] ?? '',
            }))}
            vide="Aucun engagement — la section est masquée sur le site."
          />
          <Liste
            libelle="Équipe"
            elements={(b.equipe ?? []).map((membre) => ({ titre: membre.nom, texte: membre.role }))}
            vide="Personne pour l’instant — la section « L’équipe écoles360 » est masquée sur le site."
          />

          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', borderTop: '1px solid #F1ECE3', paddingTop: 14 }}>
            <Coordonnee libelle="Téléphone" valeur={b.coordonnees?.telephone} />
            <Coordonnee libelle="WhatsApp" valeur={b.coordonnees?.whatsapp} />
            <Coordonnee libelle="E-mail" valeur={b.coordonnees?.email} />
            <Coordonnee libelle="Adresse" valeur={b.coordonnees?.adresse} />
            <Coordonnee libelle="Horaires" valeur={b.coordonnees?.horaires} />
          </div>
        </div>
      </section>

      <p style={{ ...texteDoux, fontSize: 12.5 }}>
        Chaque publication est journalisée avec le contenu d’avant et d’après (RG15, RG26).
      </p>

      {edition && (
        <Formulaire
          valeurs={edition}
          enCours={publication.isPending}
          onPublier={(blocs) => publication.mutate(blocs)}
          onFermer={() => setEdition(null)}
        />
      )}
    </div>
  );
}

/** Un bloc absent en base devient un champ vide, jamais un plantage. */
function versFormulaire(page: PageAPropos): BlocsAPropos {
  const b = page.blocs;

  return {
    accroche: b.accroche ?? '',
    mission: b.mission ?? '',
    histoire: b.histoire ?? '',
    valeurs: b.valeurs ?? [],
    engagements: b.engagements ?? [],
    equipe: b.equipe ?? [],
    coordonnees: {
      email: b.coordonnees?.email ?? '',
      telephone: b.coordonnees?.telephone ?? '',
      adresse: b.coordonnees?.adresse ?? '',
      whatsapp: b.coordonnees?.whatsapp ?? '',
      horaires: b.coordonnees?.horaires ?? '',
    },
  };
}

/**
 * Nettoie la saisie avant l'envoi.
 *
 * Une ligne laissée entièrement vide est retirée — c'est « je n'en veux
 * pas ». Une ligne à moitié remplie part telle quelle : l'API la refuse en 422
 * avec un message qui dit quel champ manque, plutôt que de la jeter en
 * silence.
 */
function nettoyer(saisie: BlocsAPropos): BlocsAPropos {
  const garder = (...champs: string[]) => champs.some((champ) => champ.trim() !== '');
  const whatsapp = saisie.coordonnees.whatsapp?.trim();
  const horaires = saisie.coordonnees.horaires?.trim();

  return {
    accroche: saisie.accroche.trim(),
    mission: saisie.mission.trim(),
    histoire: saisie.histoire.trim(),
    valeurs: saisie.valeurs
      .filter((v) => garder(v.titre, v.texte))
      .map((v) => ({ titre: v.titre.trim(), texte: v.texte.trim() })),
    engagements: saisie.engagements
      .filter((e) => garder(e.titre, e.texte))
      .map((e) => ({ titre: e.titre.trim(), texte: e.texte.trim() })),
    equipe: saisie.equipe
      .filter((m) => garder(m.nom, m.role))
      .map((m) => ({ nom: m.nom.trim(), role: m.role.trim() })),
    coordonnees: {
      email: saisie.coordonnees.email.trim(),
      telephone: saisie.coordonnees.telephone.trim(),
      adresse: saisie.coordonnees.adresse.trim(),
      // Vide : la clé n'est pas envoyée, et le bloc WhatsApp disparaît du site.
      ...(whatsapp ? { whatsapp } : {}),
      ...(horaires ? { horaires } : {}),
    },
  };
}

function Formulaire({
  valeurs,
  enCours,
  onPublier,
  onFermer,
}: {
  valeurs: BlocsAPropos;
  enCours: boolean;
  onPublier: (blocs: BlocsAPropos) => void;
  onFermer: () => void;
}) {
  const [saisie, setSaisie] = useState(valeurs);

  const maj = <K extends keyof BlocsAPropos>(cle: K, valeur: BlocsAPropos[K]) =>
    setSaisie((courante) => ({ ...courante, [cle]: valeur }));
  const majCoordonnee = (cle: keyof BlocsAPropos['coordonnees'], valeur: string) =>
    setSaisie((courante) => ({ ...courante, coordonnees: { ...courante.coordonnees, [cle]: valeur } }));

  return (
    <Modal
      open
      title="Modifier la page « À propos »"
      width={680}
      onClose={onFermer}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="outline" size="md" onClick={onFermer}>
            Annuler
          </Button>
          <Button variant="primary" size="md" disabled={enCours} onClick={() => onPublier(nettoyer(saisie))}>
            {enCours ? 'Publication…' : 'Publier'}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label="Titre principal"
          required
          value={saisie.accroche}
          onChange={(evenement) => maj('accroche', evenement.target.value)}
        />
        <Textarea
          label="Notre histoire — une ligne vide sépare deux paragraphes"
          required
          rows={6}
          value={saisie.histoire}
          onChange={(evenement) => maj('histoire', evenement.target.value)}
        />
        <Textarea
          label="Mission"
          required
          rows={3}
          value={saisie.mission}
          onChange={(evenement) => maj('mission', evenement.target.value)}
        />

        <Intertitre>Valeurs</Intertitre>
        <Lignes
          lignes={saisie.valeurs}
          vide={{ titre: '', texte: '' }}
          ajouter="Ajouter une valeur"
          onChange={(lignes) => maj('valeurs', lignes)}
          rendu={(ligne, changer) => (
            <>
              <Input label="Titre" value={ligne.titre} onChange={(e) => changer({ ...ligne, titre: e.target.value })} />
              <Input label="Description" value={ligne.texte} onChange={(e) => changer({ ...ligne, texte: e.target.value })} />
            </>
          )}
        />

        <Intertitre>Engagements</Intertitre>
        <Lignes
          lignes={saisie.engagements}
          vide={{ titre: '', texte: '' }}
          ajouter="Ajouter un engagement"
          onChange={(lignes) => maj('engagements', lignes)}
          rendu={(ligne, changer) => (
            <>
              <Input label="Titre" value={ligne.titre} onChange={(e) => changer({ ...ligne, titre: e.target.value })} />
              <Textarea
                label="Texte — une ligne vide sépare deux paragraphes"
                rows={4}
                value={ligne.texte}
                onChange={(e) => changer({ ...ligne, texte: e.target.value })}
              />
            </>
          )}
        />

        <Intertitre>Équipe</Intertitre>
        <Lignes
          lignes={saisie.equipe}
          vide={{ nom: '', role: '' }}
          ajouter="Ajouter un membre"
          onChange={(lignes) => maj('equipe', lignes)}
          rendu={(ligne, changer) => (
            <>
              <Input label="Nom" value={ligne.nom} onChange={(e) => changer({ ...ligne, nom: e.target.value })} />
              <Input label="Rôle" value={ligne.role} onChange={(e) => changer({ ...ligne, role: e.target.value })} />
            </>
          )}
        />

        <Intertitre>Coordonnées</Intertitre>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          <Input label="Téléphone" required value={saisie.coordonnees.telephone} onChange={(e) => majCoordonnee('telephone', e.target.value)} />
          <Input label="WhatsApp" value={saisie.coordonnees.whatsapp ?? ''} onChange={(e) => majCoordonnee('whatsapp', e.target.value)} />
          <Input label="E-mail" required type="email" value={saisie.coordonnees.email} onChange={(e) => majCoordonnee('email', e.target.value)} />
          <Input label="Adresse" required value={saisie.coordonnees.adresse} onChange={(e) => majCoordonnee('adresse', e.target.value)} />
          <Input label="Horaires" value={saisie.coordonnees.horaires ?? ''} onChange={(e) => majCoordonnee('horaires', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

/** Liste éditable : chaque ligne se modifie ou se retire, et on en ajoute en fin. */
function Lignes<L>({
  lignes,
  vide,
  ajouter,
  onChange,
  rendu,
}: {
  lignes: L[];
  vide: L;
  ajouter: string;
  onChange: (lignes: L[]) => void;
  rendu: (ligne: L, changer: (ligne: L) => void) => React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {lignes.map((ligne, rang) => (
        // Le rang sert de clé : une ligne en cours de saisie n'a pas encore
        // d'identité stable, et son titre change à chaque frappe.
        <div key={rang} style={{ border: '1px solid #EAE6DE', borderRadius: 11, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rendu(ligne, (nouvelle) => onChange(lignes.map((l, r) => (r === rang ? nouvelle : l))))}
          <div>
            <Button variant="ghost" size="sm" onClick={() => onChange(lignes.filter((_, r) => r !== rang))}>
              Retirer
            </Button>
          </div>
        </div>
      ))}
      <div>
        <Button variant="outline" size="sm" onClick={() => onChange([...lignes, vide])}>
          {ajouter}
        </Button>
      </div>
    </div>
  );
}

function Lecture({ libelle, valeur }: { libelle: string; valeur?: string }) {
  return (
    <div>
      <div style={intitule}>{libelle}</div>
      <div style={{ fontSize: 13.5, color: valeur ? '#3A424E' : '#9AA3AF', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
        {valeur || 'Non renseigné'}
      </div>
    </div>
  );
}

function Liste({
  libelle,
  elements,
  vide,
}: {
  libelle: string;
  elements: { titre: string; texte: string }[];
  vide: string;
}) {
  return (
    <div>
      <div style={{ ...intitule, marginBottom: 8 }}>{libelle}</div>
      {elements.length === 0 ? (
        <div style={{ fontSize: 13, color: '#9AA3AF' }}>{vide}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {elements.map((element, rang) => (
            <div key={rang} style={{ border: '1px solid #EAE6DE', borderRadius: 11, padding: '14px 15px' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{element.titre}</div>
              <div style={{ fontSize: 12.5, color: '#5A6472', lineHeight: 1.5, marginTop: 4 }}>{element.texte}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Coordonnee({ libelle, valeur }: { libelle: string; valeur?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#9AA3AF', textTransform: 'uppercase', letterSpacing: '.4px' }}>{libelle}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: valeur ? '#1A1A1A' : '#9AA3AF' }}>{valeur || '—'}</div>
    </div>
  );
}

function Intertitre({ children }: { children: React.ReactNode }) {
  return <div style={{ ...intitule, color: '#9AA3AF', marginTop: 6 }}>{children}</div>;
}

const carte: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #EAE6DE',
  borderRadius: 14,
  padding: '22px 24px',
};

const intitule: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '.5px',
  textTransform: 'uppercase',
  color: '#9AA3AF',
  marginBottom: 5,
};

const texteDoux: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
