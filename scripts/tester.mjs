#!/usr/bin/env node
/**
 * Joue la suite de tests DANS le conteneur `api`.
 *
 * POURQUOI PAS DEPUIS WINDOWS, où la commande du livrable 13 fonctionne
 * pourtant. Elle joint MySQL par `127.0.0.1:3306`, donc par le relais de port
 * de Docker Desktop — un pont entre Windows et la machine virtuelle Linux.
 * Une suite complète ouvre et referme des milliers de connexions, et ce relais
 * en perd une de temps en temps. Le symptôme est un `Can't reach database
 * server at 127.0.0.1:3306` au milieu d'une exécution, sur une requête
 * quelconque, alors que MySQL n'a jamais bronché : conteneur jamais
 * redémarré, 19 connexions simultanées au plus sur 151 autorisées, zéro
 * erreur de saturation. Relancer suffit — ce qui est précisément ce qui rend
 * la panne coûteuse : on doute d'abord de son propre code.
 *
 * Ici, le processus de test tourne À L'INTÉRIEUR du réseau Docker : il joint
 * `mysql:3306` et `redis:6379` directement, par le nom de service. Il n'y a
 * plus de relais, donc plus rien à perdre. C'est aussi ce que fait
 * l'intégration continue, et ce que fera la production — seule l'exécution
 * depuis Windows traversait ce pont.
 *
 * LES SOURCES VIENNENT DU POSTE. `./api` est monté dans le conteneur : on
 * teste bien le code qu'on vient d'écrire, sans reconstruire d'image. Le
 * client Prisma généré convient aux deux mondes, `binaryTargets` déclarant
 * `native` ET `linux-musl-openssl-3.0.x` (schema.prisma).
 *
 * Tout argument supplémentaire est passé à Jest :
 *     node scripts/tester.mjs                          — toute la suite
 *     node scripts/tester.mjs test/modules/mail.spec.ts
 *     node scripts/tester.mjs -t "réseaux sociaux"
 */
import { spawnSync } from 'node:child_process';

const COMPOSE = ['compose', '-f', 'docker-compose.dev.yml'];
const SERVICE = 'api';

/**
 * Redis BASE 15, RÉSERVÉE AUX TESTS (livrable 13 §1). Les suites la vident
 * entre les cas ; la pointer sur la base 0 effacerait les sessions de
 * développement en cours, et l'on chercherait longtemps pourquoi on est
 * déconnecté à chaque exécution.
 */
const ENVIRONNEMENT = {
  DATABASE_URL: 'mysql://ecoles360:motdepasse_dev@mysql:3306/ecoles360_test',
  REDIS_URL: 'redis://redis:6379/15',
  NODE_ENV: 'test',
};

/** Vrai si le service tourne — sans lui, `exec` échoue avec un message obscur. */
function conteneurDebout() {
  const sonde = spawnSync('docker', [...COMPOSE, 'ps', '--status', 'running', '--services'], {
    encoding: 'utf8',
  });

  return sonde.status === 0 && sonde.stdout.split(/\r?\n/).includes(SERVICE);
}

if (!conteneurDebout()) {
  console.error(
    `Le conteneur « ${SERVICE} » ne tourne pas.\n\n` +
      '  docker compose -f docker-compose.dev.yml up -d\n\n' +
      'Puis relancez cette commande.',
  );
  process.exit(1);
}

const variables = Object.entries(ENVIRONNEMENT).flatMap(([cle, valeur]) => [
  '-e',
  `${cle}=${valeur}`,
]);

/**
 * Protège un argument pour `sh -c`.
 *
 * ÉCRIT APRÈS S'ÊTRE FAIT AVOIR. Les arguments étaient simplement recollés
 * avec des espaces : `-t "garde le sujet neutre"` arrivait au shell comme
 * quatre mots, Jest prenait « garde » pour le filtre et « le sujet neutre »
 * pour des chemins de fichiers. Il ne plantait pas — il exécutait autre
 * chose, en annonçant un succès.
 */
const proteger = (argument) => `'${argument.replaceAll("'", `'\\''`)}'`;

const arguments_ = process.argv.slice(2).map(proteger).join(' ');

// `-T` DÉSACTIVE L'ALLOCATION D'UN PSEUDO-TERMINAL. Sans lui, la commande
// échoue dès qu'elle n'est pas lancée depuis un terminal interactif — une
// tâche planifiée, un crochet Git, ou simplement un outil qui capture la
// sortie.
const jeu = spawnSync(
  'docker',
  [
    ...COMPOSE,
    'exec',
    '-T',
    ...variables,
    SERVICE,
    'sh',
    '-c',
    `cd /app/api && npx jest ${arguments_}`.trim(),
  ],
  { stdio: 'inherit' },
);

process.exit(jeu.status ?? 1);
