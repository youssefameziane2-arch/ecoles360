/**
 * Sérialisation des identifiants — livrable 11 §1.
 *
 * « BigInt sérialisé en string (id) via un serializer partagé. »
 *
 * POURQUOI C'EST NÉCESSAIRE. Toutes les clés primaires du schéma sont des
 * `BIGINT UNSIGNED` (livrable 10 §1), que Prisma expose en `bigint`. Or
 * `JSON.stringify` lève `TypeError: Do not know how to serialize a BigInt` :
 * sans ce fichier, toute réponse contenant un identifiant produit un 500.
 *
 * POURQUOI EN CHAÎNE ET NON EN NOMBRE. Au-delà de 2^53, un entier JavaScript
 * perd en précision. Les identifiants n'atteindront pas ce seuil de sitôt, mais
 * une valeur tronquée serait indétectable — elle désignerait silencieusement
 * une autre ligne. La chaîne supprime la question.
 *
 * POURQUOI SUR LE PROTOTYPE ET NON DANS UN INTERCEPTOR. Un interceptor ne
 * s'exécute pas sur le chemin d'erreur : le `details` d'une exception — celui
 * de `ScopesGuard`, par exemple — contiendrait des `BigInt` non sérialisables,
 * et une erreur métier légitime se transformerait en 500 opaque. Le prototype
 * couvre les deux chemins de la même façon.
 *
 * Rien n'est écrasé : `BigInt` n'a pas de `toJSON` natif. Ce fichier ajoute une
 * méthode absente, il n'en remplace aucune.
 *
 * À importer en TOUT PREMIER dans `main.ts` et `cli.ts`, avant que le moindre
 * module ne puisse sérialiser quoi que ce soit.
 */

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function toJSON(this: bigint): string {
  return this.toString();
};

export {};
