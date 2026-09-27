import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/api/client';
import { Button, Icon } from '@/ds/composants';
import { useTitrePage } from '@/lib/titre';

interface ReponseConnexion {
  utilisateur: { id: string; email: string; role: string };
  csrf: string;
}

/**
 * Mot de passe commun aux comptes de démonstration.
 *
 * C'est la valeur de repli du semeur (`SEED_*_PASSWORD` absent de `.env`).
 * Elle est AFFICHÉE À L'ÉCRAN parce qu'elle ne protège rien : ces comptes
 * n'existent que sur les bases de développement et de recette. En production,
 * le semeur de démonstration ne tourne pas — seuls les référentiels sont
 * amorcés — et ce bloc ne s'affiche donc devant personne.
 */
const MOT_DE_PASSE_DEMO = 'motdepasse-de-demonstration';

/** Comptes du jeu de démonstration — repris tels quels de la maquette. */
const COMPTES_DEMO = [
  { libelle: 'Direction (admin)', email: 'direction@ecoles360.com', emoji: '🏛', fond: '#E63946' },
  { libelle: 'Secrétariat', email: 'sara.s@ecoles360.com', emoji: '🗂', fond: '#1D3557' },
  { libelle: 'Établissement', email: 'contact@almassira.ma', emoji: '🏫', fond: '#2E9E5B' },
  { libelle: 'Commercial', email: 'younes.c@ecoles360.com', emoji: '💼', fond: '#E9A23B' },
];

const ARGUMENTS_CONNEXION = [
  'Statistiques de vues et de contacts en temps réel',
  'Gérez votre fiche, vos avis et votre abonnement',
  'Recevez des demandes de parents qualifiés',
];

/**
 * Connexion — porté de l'écran `isLogin` de la maquette « Espace écoles360 ».
 *
 * EN UN SEUL TEMPS, ET C'EST UN ÉCART ASSUMÉ. La maquette procède en deux
 * étapes (`loginStep: 'email'`) : l'adresse, puis un second écran pour le mot
 * de passe. Le client a tranché autrement — un formulaire unique, e-mail et
 * mot de passe ensemble. Deux raisons lui donnent raison : les gestionnaires
 * de mots de passe remplissent mal un parcours en deux temps, et un écran
 * intermédiaire ajoute un clic sans rien décider tant qu'il n'existe qu'une
 * seule méthode d'authentification. Le bouton Google reste en place pour le
 * jour où il y en aura deux.
 *
 * DESTINATION DE RETOUR CONTRÔLÉE. `?retour=` vient de l'URL, donc de
 * l'extérieur : on n'y obéit que s'il désigne un chemin interne. Sans ce
 * filtre, un lien `/connexion?retour=https://site-pirate.example` ferait de
 * notre page de connexion un tremplin de redirection.
 */
export function Connexion() {
  useTitrePage('Connexion', 'Accédez à votre espace de gestion écoles360.');

  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [noteGoogle, setNoteGoogle] = useState(false);

  const connexion = useMutation({
    mutationFn: () =>
      apiFetch<ReponseConnexion>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, mot_de_passe: motDePasse }),
      }),
    onSuccess: (reponse) => {
      // Rechargement complet plutôt que navigation cliente : l'identité, les
      // portées et le jeton CSRF se relisent une fois, proprement, au
      // démarrage de l'espace.
      window.location.href = destinationSure(params.get('retour'), reponse.utilisateur.role);
    },
  });

  const erreur = connexion.error instanceof ApiError ? connexion.error : null;

  return (
    <div className="e-login">
      {/* ---- Panneau de gauche ---------------------------------------- */}
      <div
        style={{
          position: 'relative',
          background: '#15233A',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
        }}
      >
        <div style={{ position: 'absolute', right: -80, top: -80, width: 340, height: 340, borderRadius: '50%', background: 'rgba(230,57,70,.14)' }} />
        <div style={{ position: 'absolute', left: -60, bottom: -100, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />

        <img
          src="/ecoles360-logo-dark.png"
          alt="écoles360"
          style={{ position: 'relative', height: 44, width: 'auto', alignSelf: 'flex-start' }}
        />

        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.18)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '.4px',
              padding: '6px 13px',
              borderRadius: 20,
              textTransform: 'uppercase',
              marginBottom: 22,
            }}
          >
            Espace de gestion
          </div>

          <h1 style={{ margin: 0, color: '#fff', fontSize: 34, lineHeight: 1.18, fontWeight: 800, letterSpacing: '-0.8px' }}>
            Pilotez votre présence
            <br />
            sur écoles<span style={{ color: '#E63946' }}>360</span>
          </h1>

          <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 15 }}>
            {ARGUMENTS_CONNEXION.map((argument) => (
              <div key={argument} style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#C7D3E4', fontSize: 15 }}>
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'rgba(46,158,91,.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  <Icon name="check" size={14} color="#2EE08A" strokeWidth={2.6} />
                </span>
                {argument}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', color: '#5E73A0', fontSize: 12.5 }}>
          © {new Date().getFullYear()} écoles360 · Annuaire des établissements privés au Maroc
        </div>
      </div>

      {/* ---- Panneau de droite ----------------------------------------- */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#FBFAF7' }}>
        <div style={{ width: '100%', maxWidth: 390 }}>
          <img
            src="/ecoles360-logo.png"
            alt="écoles360"
            style={{ height: 34, width: 'auto', display: 'block', margin: '0 auto 26px' }}
          />

          <h2 style={{ margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Connexion à votre espace
          </h2>
          <p style={{ margin: '8px 0 24px', fontSize: 14.5, color: '#5A6472', lineHeight: 1.5 }}>
            Saisissez votre adresse e-mail et votre mot de passe.
          </p>

          {erreur && (
            <div
              role="alert"
              style={{
                background: '#FDE8EA',
                border: '1px solid #F5C6CB',
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 13,
                color: '#C42B38',
                marginBottom: 14,
              }}
            >
              {erreur.message}
            </div>
          )}

          <form
            onSubmit={(evenement) => {
              evenement.preventDefault();
              connexion.mutate();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <ChampAvecIcone
              label="Adresse e-mail"
              icone="mail"
              type="email"
              placeholder="vous@votre-ecole.ma"
              valeur={email}
              onChange={setEmail}
              autoComplete="email"
            />

            <ChampAvecIcone
              label="Mot de passe"
              icone="settings"
              type="password"
              placeholder="••••••••"
              valeur={motDePasse}
              onChange={setMotDePasse}
              autoComplete="current-password"
            />

            <Button
              variant="primary"
              size="lg"
              block
              type="submit"
              disabled={!email || !motDePasse || connexion.isPending}
            >
              {connexion.isPending ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>

          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 13, color: '#5A6472', lineHeight: 1.6 }}>
            {/* Pas de lien « mot de passe oublié » tant que l'envoi d'e-mails
                n'est pas en service : la route existe et répond 202, mais aucun
                message ne partirait. Voir docs/BACKLOG.md, B-24. */}
            Mot de passe oublié ? Écrivez-nous à{' '}
            <a href="mailto:contact@ecoles360.com" style={{ color: '#1D3557', fontWeight: 600 }}>
              contact@ecoles360.com
            </a>
          </div>

          <Separateur>OU</Separateur>

          <button
            type="button"
            onClick={() => setNoteGoogle(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              height: 48,
              border: '1px solid #D4DAE2',
              background: '#fff',
              borderRadius: 10,
              fontFamily: 'inherit',
              fontSize: 14.5,
              fontWeight: 600,
              color: '#1A1A1A',
              cursor: 'pointer',
            }}
          >
            <LogoGoogle />
            Continuer avec Google
          </button>

          {noteGoogle && (
            <div style={{ marginTop: 10, fontSize: 12.5, color: '#9AA3AF', lineHeight: 1.5, textAlign: 'center' }} role="status">
              L&rsquo;authentification Google sera disponible prochainement. Connectez-vous avec
              votre e-mail pour l&rsquo;instant.
            </div>
          )}

          <Separateur espacement="24px 0 16px" gras={false}>
            Comptes de démonstration
          </Separateur>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {COMPTES_DEMO.map((compte) => (
              <button
                key={compte.email}
                type="button"
                // REMPLIT LES DEUX CHAMPS, et ne connecte pas tout seul : on voit
                // ce qui va partir avant de l'envoyer, et le formulaire reste le
                // seul chemin de connexion.
                onClick={() => {
                  setEmail(compte.email);
                  setMotDePasse(MOT_DE_PASSE_DEMO);
                  connexion.reset();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  border: `1px solid ${email === compte.email ? '#1D3557' : '#EAE6DE'}`,
                  borderRadius: 11,
                  padding: '11px 14px',
                  cursor: 'pointer',
                  background: '#fff',
                  textAlign: 'left',
                  width: '100%',
                  font: 'inherit',
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: compte.fond,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    flex: 'none',
                  }}
                  aria-hidden
                >
                  {compte.emoji}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700 }}>
                    {compte.libelle}
                  </span>
                  <span style={{ display: 'block', fontSize: 12, color: '#9AA3AF' }}>
                    {compte.email}
                  </span>
                </span>
                <Icon name="chevron-right" size={16} color="#C9CFD8" />
              </button>
            ))}
          </div>

          <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: '#9AA3AF' }}>
            Mot de passe commun : <code>{MOT_DE_PASSE_DEMO}</code>
          </div>

          <div style={{ marginTop: 22, textAlign: 'center', fontSize: 13.5, color: '#5A6472' }}>
            Pas encore référencé ?{' '}
            <Link to="/inscription-etablissement" style={{ color: '#E63946', fontWeight: 600 }}>
              Inscrire mon établissement
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

/** Champ avec icône à gauche — équivalent de l'`Input` à `icon` de la maquette. */
function ChampAvecIcone({
  label,
  icone,
  type,
  placeholder,
  valeur,
  onChange,
  autoComplete,
  autoFocus,
}: {
  label: string;
  icone: string;
  type: string;
  placeholder: string;
  valeur: string;
  onChange: (valeur: string) => void;
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#2A313B', marginBottom: 7 }}>
        {label}
      </span>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          border: '1px solid #E1E5EA',
          background: '#fff',
          borderRadius: 10,
          padding: '0 14px',
        }}
      >
        <Icon name={icone} size={17} color="#9AA3AF" />
        <input
          type={type}
          value={valeur}
          onChange={(evenement) => onChange(evenement.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            font: 'inherit',
            fontSize: 14.5,
            padding: '14px 0',
            color: '#1A1A1A',
            outline: 'none',
          }}
        />
      </span>
    </label>
  );
}

function Separateur({
  children,
  espacement = '20px 0',
  gras = true,
}: {
  children: React.ReactNode;
  espacement?: string;
  gras?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: espacement }}>
      <div style={{ flex: 1, height: 1, background: '#EAE6DE' }} />
      <span
        style={{
          fontSize: 12,
          color: '#9AA3AF',
          fontWeight: gras ? 600 : 500,
          letterSpacing: gras ? '.5px' : undefined,
        }}
      >
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: '#EAE6DE' }} />
    </div>
  );
}

function LogoGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

/**
 * N'accepte qu'un chemin interne — `/espace/fiche`, jamais `//ailleurs.example`
 * ni `https://…`. Le double slash initial est refusé explicitement : le
 * navigateur le lit comme une URL absolue à protocole implicite.
 *
 * À défaut de destination demandée, chacun atterrit chez lui : un Super Admin
 * sur la vue d'ensemble du back-office, un commercial dans son espace, les autres (établissement
 * et secrétariat) dans l'espace établissement. Un commercial envoyé sur
 * `/espace` serait refusé par la garde juste après une connexion réussie.
 */
function destinationSure(retour: string | null, role: string): string {
  if (!retour || !retour.startsWith('/') || retour.startsWith('//')) {
    if (role === 'superadmin') return '/admin';
    if (role === 'commercial') return '/commercial';
    return '/espace';
  }

  return retour;
}
