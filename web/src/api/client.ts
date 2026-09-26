/**
 * Client HTTP unique — livrable 12 §4.
 *
 * « apiFetch — same-origin, credentials: include, en-tête CSRF »
 *
 * MÊME ORIGINE, JAMAIS DE JETON STOCKÉ. Le cookie de session `HttpOnly` /
 * `SameSite=Lax` part seul parce que nginx sert le front et l'API sous le même
 * domaine (livrable 14 §2). Un jeton rangé dans `localStorage` serait lisible
 * par n'importe quel script tiers de la page ; le cookie `HttpOnly`, non.
 *
 * L'ENVELOPPE EST DÉBALLÉE ICI, une fois pour toutes. L'API rend
 * `{data, meta, links}` (livrable 11 §1) ; le reste de l'application ne
 * manipule que `data`. Une collection paginée passe par `apiFetchPage`, qui
 * conserve `meta` et `links`.
 */

/** Enveloppe de réponse de l'API — livrable 11 §1. */
interface Enveloppe<T> {
  data: T;
  meta: MetaPagination | Record<string, never>;
  links: LiensPagination | Record<string, never>;
}

export interface MetaPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface LiensPagination {
  self: string;
  first: string;
  prev: string | null;
  next: string | null;
  last: string;
}

/** Format d'erreur de l'API — livrable 11 §1. */
export interface ErreurApi {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

/**
 * Erreur métier remontée par l'API.
 *
 * Porte le `code` machine ET le `message` déjà rédigé en français : les toasts
 * du design system l'affichent tel quel, sans traduction ni reformulation
 * (livrable 11 §1).
 */
export class ApiError extends Error {
  constructor(
    readonly statut: number,
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Erreurs de validation, champ par champ — pour `setError` des formulaires. */
  get champs(): { champ: string; contraintes: string[] }[] {
    return Array.isArray(this.details.champs)
      ? (this.details.champs as { champ: string; contraintes: string[] }[])
      : [];
  }
}

const BASE = '/api/v1';
const NOM_COOKIE_CSRF = 'ecoles360_csrf';

/** Lit le jeton CSRF dans son cookie — délibérément lisible par le script. */
function jetonCsrf(): string | null {
  const trouve = document.cookie
    .split('; ')
    .find((morceau) => morceau.startsWith(`${NOM_COOKIE_CSRF}=`));

  return trouve ? decodeURIComponent(trouve.slice(NOM_COOKIE_CSRF.length + 1)) : null;
}

async function requete<T>(chemin: string, init: RequestInit = {}): Promise<Enveloppe<T>> {
  const entetes = new Headers(init.headers);

  // Un `FormData` porte sa propre frontière multipart, que seul le navigateur
  // sait écrire. Lui imposer `application/json` — ou même
  // `multipart/form-data` sans la frontière — rendrait le corps illisible côté
  // serveur : multer ne trouverait aucun fichier et répondrait 422.
  if (init.body && !entetes.has('content-type') && !(init.body instanceof FormData)) {
    entetes.set('content-type', 'application/json');
  }

  // Le jeton n'est envoyé que sur les mutations : l'API ne le vérifie pas sur
  // GET/HEAD/OPTIONS, et l'envoyer partout n'apporterait rien.
  const methode = (init.method ?? 'GET').toUpperCase();

  if (!['GET', 'HEAD', 'OPTIONS'].includes(methode)) {
    const csrf = jetonCsrf();
    if (csrf) {
      entetes.set('x-csrf-token', csrf);
    }
  }

  const reponse = await fetch(BASE + chemin, {
    ...init,
    headers: entetes,
    // Indispensable : sans lui, le cookie de session ne part pas.
    credentials: 'include',
  });

  if (reponse.status === 204) {
    return { data: undefined as T, meta: {}, links: {} };
  }

  const corps: unknown = await reponse.json().catch(() => null);

  if (!reponse.ok) {
    const erreur = (corps ?? {}) as Partial<ErreurApi>;

    // Session expirée ou révoquée (RG25) : le compte a pu être suspendu ou son
    // mot de passe réinitialisé pendant la navigation.
    if (reponse.status === 401) {
      redirigerVersConnexion();
    }

    throw new ApiError(
      reponse.status,
      erreur.code ?? 'erreur_inconnue',
      erreur.message ?? 'Une erreur est survenue. Merci de réessayer.',
      erreur.details ?? {},
    );
  }

  return corps as Enveloppe<T>;
}

/** Ressource unique — rend directement `data`. */
export async function apiFetch<T>(chemin: string, init?: RequestInit): Promise<T> {
  return (await requete<T>(chemin, init)).data;
}

/** Collection paginée — conserve `meta` et `links` pour la navigation. */
export async function apiFetchPage<T>(
  chemin: string,
  init?: RequestInit,
): Promise<{ data: T[]; meta: MetaPagination; links: LiensPagination }> {
  const enveloppe = await requete<T[]>(chemin, init);

  return {
    data: enveloppe.data,
    meta: enveloppe.meta as MetaPagination,
    links: enveloppe.links as LiensPagination,
  };
}

/**
 * Redirige vers la connexion en conservant la page demandée.
 *
 * Le paramètre `retour` permet de ramener l'utilisateur où il allait après
 * s'être identifié (livrable 12 §3), au lieu de le déposer sur l'accueil.
 */
function redirigerVersConnexion(): void {
  if (window.location.pathname.startsWith('/connexion')) {
    return; // déjà sur place : ne pas boucler
  }

  const retour = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/connexion?retour=${retour}`;
}
