import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { creerCompte, type CompteCree, type NouveauCompte } from '@/api/admin';
import { Champ } from '@/components/Champs';
import { Button } from '@/ds/composants';

/**
 * Création d'un compte de personnel — écrans « Secrétariat » et
 * « Commerciaux ».
 *
 * CET ÉCRAN A MANQUÉ LONGTEMPS, et pour une bonne raison : ni les livrables ni
 * la maquette ne disaient **qui a le droit de créer un compte**, ni **comment
 * le mot de passe atteint son titulaire**. La première question est tranchée
 * par les notes du client du 28 septembre 2026 — « l'admin, lorsqu'il ajoute
 * le secrétaire, il lui donne du privilège ». La seconde ne l'est toujours
 * pas, et la réponse ci-dessous est la moins mauvaise disponible.
 *
 * LE MOT DE PASSE EST AFFICHÉ UNE SEULE FOIS. Il est tiré au sort par le
 * serveur, jamais stocké en clair, et ne figure pas au journal d'audit.
 * Recharger l'écran ne le retrouvera pas. Un lien de première connexion envoyé
 * par courriel vaudrait mieux — il n'y a aucun envoi d'e-mail dans ce projet
 * (B-46). C'est aussi, exactement, la convention de `compte:creer` en ligne de
 * commande.
 */
export function CreationCompte({
  role,
  etablissements,
}: {
  role: 'secretariat' | 'commercial';
  /** Secrétariat seulement : l'API refuse un commercial rattaché. */
  etablissements?: { id: string; nom: string }[];
}) {
  const queryClient = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [etablissementId, setEtablissementId] = useState('');
  const [cree, setCree] = useState<CompteCree | null>(null);

  const creation = useMutation({
    mutationFn: (compte: NouveauCompte) => creerCompte(compte),
    onSuccess: (resultat) => {
      setCree(resultat);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'secretariat'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'commerciaux'] });
      void queryClient.invalidateQueries({ queryKey: ['conseillers'] });
    },
  });

  function fermer() {
    setOuvert(false);
    setCree(null);
    setEmail('');
    setNom('');
    setTelephone('');
    setEtablissementId('');
    creation.reset();
  }

  function envoyer() {
    creation.mutate({
      email: email.trim(),
      nom: nom.trim(),
      role,
      ...(telephone.trim() ? { telephone: telephone.trim() } : {}),
      ...(role === 'secretariat' && etablissementId ? { etablissement_id: etablissementId } : {}),
    });
  }

  if (!ouvert) {
    return (
      <Button onClick={() => setOuvert(true)}>
        + Créer un compte {role === 'secretariat' ? 'de secrétariat' : 'commercial'}
      </Button>
    );
  }

  /**
   * L'ÉCRAN NE REVIENT PAS AU FORMULAIRE TANT QUE LE MOT DE PASSE EST LÀ. Il
   * n'existe nulle part ailleurs : fermer trop vite, c'est devoir
   * réinitialiser. Le bouton de sortie le dit.
   */
  if (cree) {
    return (
      <div style={{ ...carte, borderColor: '#2E9E5B', background: '#F2FAF5' }}>
        <h3 style={{ margin: 0, font: "700 16px/1.3 'Inter', sans-serif", color: '#1F7A45' }}>
          Compte créé — {cree.email}
        </h3>
        <p style={{ ...texte, margin: '10px 0 0' }}>
          Transmettez ce mot de passe à son titulaire. <strong>Il n’est affiché qu’une fois</strong>{' '}
          : il n’est conservé nulle part en clair, et fermer cette fenêtre le perdra définitivement.
        </p>

        <div
          style={{
            marginTop: 14,
            padding: '14px 16px',
            background: '#fff',
            border: '1px solid #CBE5D5',
            borderRadius: 10,
            font: "700 18px/1.4 'Menlo', 'Consolas', monospace",
            letterSpacing: '.5px',
            wordBreak: 'break-all',
            userSelect: 'all',
          }}
        >
          {cree.mot_de_passe}
        </div>

        {role === 'secretariat' && (
          <p style={{ ...texte, marginTop: 14, fontSize: 13.5 }}>
            Ce compte n’a <strong>aucune portée</strong> pour l’instant : il se connecte, mais ne
            voit rien. Accordez-lui ci-dessous ce que vous lui déléguez (RG05).
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Button variant="outline" onClick={fermer}>
            J’ai noté le mot de passe
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={carte}>
      <h3 style={{ margin: 0, font: "700 16px/1.3 'Inter', sans-serif" }}>
        Nouveau compte {role === 'secretariat' ? 'de secrétariat' : 'commercial'}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
        <Champ
          label="Nom du titulaire"
          valeur={nom}
          onChange={setNom}
          placeholder="Sara Sabri"
          requis
        />
        <Champ
          label="Adresse e-mail"
          valeur={email}
          onChange={setEmail}
          placeholder="sara@ecoles360.com"
          requis
        />
        <Champ
          label={role === 'commercial' ? 'Téléphone' : 'Téléphone (facultatif)'}
          valeur={telephone}
          onChange={setTelephone}
          placeholder="06 61 07 27 77"
          aide={
            role === 'commercial'
              ? 'Sans ligne, ce conseiller n’apparaîtra pas sur la bannière d’aide du site public.'
              : undefined
          }
        />

        {role === 'secretariat' && etablissements && (
          <label style={{ display: 'block' }}>
            <span style={{ ...texte, fontWeight: 600, fontSize: 13.5 }}>
              Établissement rattaché
            </span>
            <select
              value={etablissementId}
              onChange={(e) => setEtablissementId(e.target.value)}
              style={{
                width: '100%',
                marginTop: 6,
                border: '1px solid #E1E5EA',
                borderRadius: 10,
                padding: '11px 12px',
                font: "400 14px/1 'Inter', sans-serif",
                background: '#fff',
              }}
            >
              <option value="">À rattacher plus tard</option>
              {etablissements.map((etablissement) => (
                <option key={etablissement.id} value={etablissement.id}>
                  {etablissement.nom}
                </option>
              ))}
            </select>
            {/* Toutes ses routes passent par l'établissement : sans rattachement,
                il se connecte et ne voit rien. */}
            <span style={{ ...texte, fontSize: 12.5, color: '#9AA3AF', display: 'block', marginTop: 6 }}>
              Sans rattachement, le compte se connecte mais n’a accès à aucune fiche.
            </span>
          </label>
        )}
      </div>

      {creation.isError && (
        <p role="alert" style={{ ...texte, color: '#C42B38', marginTop: 12 }}>
          {creation.error instanceof ApiError
            ? creation.error.message
            : 'Le compte n’a pas pu être créé.'}
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Button onClick={envoyer} disabled={creation.isPending || !nom.trim() || !email.trim()}>
          {creation.isPending ? 'Création…' : 'Créer le compte'}
        </Button>
        <Button variant="outline" onClick={fermer} disabled={creation.isPending}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

const carte: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #EAE6DE',
  borderRadius: 16,
  padding: '18px 20px',
};

const texte: React.CSSProperties = {
  font: "400 14px/1.6 'Inter', sans-serif",
  color: '#5A6472',
  margin: 0,
};
