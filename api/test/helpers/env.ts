/**
 * Garde-fou d'environnement de test — livrable 13 §2.2.
 *
 * « Redis nettoyé entre chaque suite via FLUSHDB sur la base 15 (base dédiée
 * aux tests, jamais la 0 de production). »
 *
 * Ce contrôle est délibérément brutal : mieux vaut une suite qui refuse de
 * démarrer qu'une suite qui vide la base de quelqu'un d'autre.
 */
export function verifierBaseRedisDeTest(url: string): void {
  const base = url.trim().split('/').pop();

  if (base !== '15') {
    throw new Error(
      `REDIS_URL doit pointer la base 15 en test (reçu : « ${url} »). ` +
        'Le livrable 13 §2.2 réserve la base 15 aux tests — jamais la base 0.',
    );
  }
}
