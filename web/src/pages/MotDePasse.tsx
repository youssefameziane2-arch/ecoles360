import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/api/client';
import { Button, Icon } from '@/ds/composants';
import { useTitrePage } from '@/lib/titre';

/** Le minimum que l'API accepte — `ResetMotDePasseDto`. */
const LONGUEUR_MIN = 12;

/**
 * La même composition que l'API exige.
 *
 * REDITE ICI, ET C'EST ASSUMÉ. Le serveur reste seul juge — c'est lui qui
 * refuse en 422, et aucun contrôle de navigateur ne le remplace. Mais laisser
 * l'écran accepter une saisie que l'API rejettera ferait découvrir la règle
 * APRÈS l'effort : on tape deux fois un mot de passe, on valide, et on
 * apprend alors qu'il faut un chiffre. Dire la règle d'avance coûte cette
 * duplication.
 */
const COMPOSITION = /(?=.*[a-zà-ÿ])(?=.*[A-ZÀ-Ÿ])(?=.*\d)/;

/**
 * Nouveau mot de passe, depuis le lien reçu par e-mail.
 *
 * ABSENT DE LA MAQUETTE, et ce n'est pas un oubli de sa part : le prototype
 * s'arrête à « Lien envoyé », parce qu'il n'envoie rien. Le lien doit bien
 * atterrir quelque part. L'écran reprend donc la carte de connexion à
 * l'identique — même largeur, même logo, mêmes champs — pour que le parcours
 * ne change pas d'apparence au milieu.
 *
 * LE JETON NE QUITTE JAMAIS CETTE PAGE. Il arrive dans l'URL, part dans le
 * corps de la requête, et rien ne l'écrit ailleurs : ni dans un état
 * persistant, ni dans un journal. Le connaître suffirait à changer le mot de
 * passe du compte.
 *
 * AUCUNE VÉRIFICATION PRÉALABLE DU JETON. On pourrait interroger l'API au
 * chargement pour afficher « ce lien a expiré » avant la saisie ; ce serait
 * un oracle — une route qui répond oui ou non sur un jeton, essayable en
 * boucle. Le jeton n'est éprouvé qu'au moment où il sert, par la route qui en
 * a besoin de toute façon.
 */
export function MotDePasse() {
  useTitrePage('Nouveau mot de passe');

  const [params] = useSearchParams();
  const jeton = params.get('jeton') ?? '';

  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const reinitialisation = useMutation({
    mutationFn: () =>
      apiFetch<void>('/auth/reset-mot-de-passe', {
        method: 'POST',
        body: JSON.stringify({ jeton, nouveau_mot_de_passe: motDePasse }),
      }),
  });

  const erreur = reinitialisation.error instanceof ApiError ? reinitialisation.error : null;
  const assezLong = motDePasse.length >= LONGUEUR_MIN;
  const bienCompose = COMPOSITION.test(motDePasse);
  const different = confirmation.length > 0 && confirmation !== motDePasse;
  const pretAEnvoyer = assezLong && bienCompose && confirmation === motDePasse;

  // Un seul reproche à la fois, la longueur d'abord : énumérer tout ce qui
  // manque pendant qu'on tape les trois premières lettres est décourageant.
  const reproche = (() => {
    if (motDePasse.length === 0) return null;
    if (!assezLong) return `Encore ${LONGUEUR_MIN - motDePasse.length} caractère(s).`;
    if (!bienCompose) return 'Il faut au moins une minuscule, une majuscule et un chiffre.';
    return null;
  })();

  return (
    <div style={cadre}>
      <div style={{ width: '100%', maxWidth: 390 }}>
        <img src="/ecoles360-logo.png" alt="écoles360" style={logo} />

        {reinitialisation.isSuccess ? (
          <Reussite />
        ) : !jeton ? (
          /*
            SANS JETON, ON NE MONTRE PAS LE FORMULAIRE. Quelqu'un qui arrive
            ici par l'URL seule le remplirait pour rien, et l'erreur ne
            tomberait qu'à l'envoi.
          */
          <Vide />
        ) : (
          <>
            <h1 style={titre}>Choisissez un nouveau mot de passe</h1>
            <p style={sousTitre}>
              Au moins {LONGUEUR_MIN} caractères, avec une minuscule, une majuscule et un
              chiffre. Vos sessions ouvertes ailleurs seront fermées.
            </p>

            {erreur && (
              <div role="alert" style={alerte}>
                {erreur.message}
              </div>
            )}

            <form
              onSubmit={(evenement) => {
                evenement.preventDefault();
                if (pretAEnvoyer) reinitialisation.mutate();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <Champ
                label="Nouveau mot de passe"
                valeur={motDePasse}
                onChange={setMotDePasse}
                autoComplete="new-password"
                autoFocus
                aide={reproche}
              />
              <Champ
                label="Confirmez le mot de passe"
                valeur={confirmation}
                onChange={setConfirmation}
                autoComplete="new-password"
                aide={different ? 'Les deux saisies diffèrent.' : null}
              />

              <Button
                variant="primary"
                size="lg"
                block
                type="submit"
                disabled={!pretAEnvoyer || reinitialisation.isPending}
              >
                {reinitialisation.isPending ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
              </Button>
            </form>
          </>
        )}

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link to="/connexion" style={{ fontSize: 13.5, color: '#5A6472', fontWeight: 600 }}>
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

function Reussite() {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={pastille('#E6F4EC')}>
        <Icon name="check" size={30} color="#2E9E5B" strokeWidth={2.4} />
      </div>
      <h1 style={titre}>Mot de passe enregistré</h1>
      <p style={sousTitre}>
        Vous pouvez vous connecter avec votre nouveau mot de passe. Les sessions qui étaient
        ouvertes sur d&rsquo;autres appareils ont été fermées.
      </p>
      <Link to="/connexion" style={{ display: 'block' }}>
        <Button variant="primary" size="lg" block>
          Se connecter
        </Button>
      </Link>
    </div>
  );
}

function Vide() {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={pastille('#FDE8EA')}>
        <Icon name="alert-triangle" size={28} color="#C42B38" strokeWidth={2.2} />
      </div>
      <h1 style={titre}>Lien incomplet</h1>
      <p style={sousTitre}>
        Cette adresse ne porte aucun jeton de réinitialisation. Ouvrez le lien tel qu&rsquo;il
        figure dans l&rsquo;e-mail, ou demandez-en un nouveau depuis la page de connexion.
      </p>
    </div>
  );
}

function Champ({
  label,
  valeur,
  onChange,
  autoComplete,
  autoFocus,
  aide,
}: {
  label: string;
  valeur: string;
  onChange: (valeur: string) => void;
  autoComplete: string;
  autoFocus?: boolean;
  aide: string | null;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          font: "600 13px/1 'Inter', sans-serif",
          color: '#3A424E',
          marginBottom: 7,
        }}
      >
        {label}
      </span>
      <input
        type="password"
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        placeholder="••••••••••••"
        style={{
          width: '100%',
          height: 48,
          border: `1px solid ${aide ? '#F0CDD0' : '#D4DAE2'}`,
          borderRadius: 10,
          background: '#fff',
          fontFamily: 'inherit',
          fontSize: 14.5,
          padding: '0 13px',
          color: '#1A1A1A',
        }}
      />
      {aide && (
        <span style={{ display: 'block', fontSize: 12.5, color: '#C42B38', marginTop: 6 }}>
          {aide}
        </span>
      )}
    </label>
  );
}

const pastille = (fond: string): React.CSSProperties => ({
  width: 64,
  height: 64,
  borderRadius: '50%',
  background: fond,
  display: 'grid',
  placeItems: 'center',
  margin: '6px auto 20px',
});

const cadre: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 40,
  background: '#FBFAF7',
};

const logo: React.CSSProperties = {
  height: 34,
  width: 'auto',
  display: 'block',
  margin: '0 auto 26px',
};

const titre: React.CSSProperties = {
  margin: 0,
  fontSize: 25,
  fontWeight: 800,
  letterSpacing: '-0.5px',
};

const sousTitre: React.CSSProperties = {
  margin: '10px 0 26px',
  fontSize: 14.5,
  color: '#5A6472',
  lineHeight: 1.55,
};

const alerte: React.CSSProperties = {
  background: '#FDE8EA',
  border: '1px solid #F5C6CB',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 13,
  color: '#C42B38',
  marginBottom: 14,
};
