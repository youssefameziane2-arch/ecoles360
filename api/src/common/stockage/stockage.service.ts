import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isAbsolute, join, normalize, resolve, sep } from 'node:path';
import { AppException, ERROR_CODES } from '../errors';

/**
 * Médias téléversés — livrable 7 §1 : « le fichier vit dans le volume
 * `storage`, seul le chemin est persisté ».
 *
 * RIEN DE BINAIRE EN BASE. Une photo de 400 Ko dans une colonne BLOB alourdit
 * chaque sauvegarde MySQL, chaque réplication et chaque restauration, pour un
 * contenu que le serveur web sait servir mieux et met en cache. La base ne
 * porte donc que le chemin.
 *
 * LE NOM DU FICHIER EST TIRÉ AU SORT, jamais repris de `originalname`. Un nom
 * fourni par le client est une entrée hostile : `../../.env` remonterait hors
 * du volume, et deux écoles qui téléversent chacune `photo.jpg` écraseraient
 * mutuellement leur façade. Seule l'extension est conservée, et seulement
 * après validation du type réel.
 */

/** Types acceptés, avec l'extension qu'on leur donne sur le disque. */
const FORMATS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Plafond par fichier — 5 Mo.
 *
 * Large pour une photo d'école exportée d'un téléphone, assez bas pour qu'un
 * téléversement en boucle ne remplisse pas le disque avant que quiconque s'en
 * aperçoive.
 */
export const POIDS_MAX_OCTETS = 5 * 1024 * 1024;

/** Fichier reçu de multer — les seuls champs dont ce service a besoin. */
export interface FichierTeleverse {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class StockageService {
  private readonly logger = new Logger(StockageService.name);

  /** Racine absolue du volume — `STOCKAGE_RACINE`, sinon `storage/` à la racine du dépôt. */
  private readonly racine: string;

  constructor(config: ConfigService) {
    const configuree = config.get<string>('STOCKAGE_RACINE');

    this.racine = configuree
      ? resolve(configuree)
      : resolve(process.cwd(), process.cwd().endsWith(`${sep}api`) ? '../storage' : 'storage');
  }

  /**
   * Écrit un fichier sous `dossier/` et rend son chemin PUBLIC (`/media/…`).
   *
   * C'est ce chemin public — pas le chemin disque — qui est persisté : le
   * volume peut déménager, le jour où les médias partent sur un stockage
   * objet, sans réécrire une ligne de la base.
   */
  async enregistrer(
    dossier: string,
    fichier: FichierTeleverse,
  ): Promise<{ chemin: string; poids: number }> {
    const extension = this.extensionValidee(fichier);

    if (fichier.size > POIDS_MAX_OCTETS) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        `Ce fichier pèse ${Math.round(fichier.size / 1024 / 1024)} Mo — le maximum est de ${POIDS_MAX_OCTETS / 1024 / 1024} Mo.`,
      );
    }

    const nom = `${randomBytes(16).toString('hex')}.${extension}`;
    const destination = this.cheminDisque(join(dossier, nom));

    await fs.mkdir(this.cheminDisque(dossier), { recursive: true });
    await fs.writeFile(destination, fichier.buffer);

    return { chemin: `/media/${dossier}/${nom}`, poids: fichier.size };
  }

  /**
   * Efface un fichier d'après son chemin public.
   *
   * L'ABSENCE N'EST PAS UNE ERREUR. Un média peut avoir disparu du volume —
   * restauration partielle, nettoyage manuel — sans que sa ligne ait été
   * supprimée ; refuser de poursuivre laisserait alors la ligne orpheline pour
   * toujours, ce qui est exactement l'inverse du but.
   */
  async effacer(cheminPublic: string): Promise<void> {
    const relatif = this.versRelatif(cheminPublic);

    if (!relatif) {
      return; // chemin étranger au volume (ex. photo de démonstration) : rien à faire
    }

    try {
      await fs.unlink(this.cheminDisque(relatif));
    } catch (erreur) {
      const code = (erreur as NodeJS.ErrnoException).code;

      if (code !== 'ENOENT') {
        this.logger.warn(`Média non supprimé (${code}) : ${cheminPublic}`);
      }
    }
  }

  /** Racine du volume — `main.ts` la sert en statique sous `/media`. */
  get racineDisque(): string {
    return this.racine;
  }

  /**
   * Valide le type déclaré ET la signature réelle des premiers octets.
   *
   * Le `Content-Type` d'un multipart est écrit par le client : il suffit de
   * l'annoncer `image/png` pour faire passer n'importe quoi. Les magic bytes,
   * eux, ne se déclarent pas.
   */
  private extensionValidee(fichier: FichierTeleverse): string {
    const extension = FORMATS[fichier.mimetype];

    if (!extension || !this.signatureConcorde(fichier.buffer, extension)) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        'Formats acceptés : JPEG, PNG ou WebP.',
      );
    }

    return extension;
  }

  private signatureConcorde(buffer: Buffer, extension: string): boolean {
    if (buffer.length < 12) {
      return false;
    }

    switch (extension) {
      case 'jpg':
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      case 'png':
        return buffer
          .subarray(0, 8)
          .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      case 'webp':
        return (
          buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
          buffer.subarray(8, 12).toString('ascii') === 'WEBP'
        );
      default:
        return false;
    }
  }

  /** `/media/etablissements/3/ab.jpg` → `etablissements/3/ab.jpg`, ou null si hors volume. */
  private versRelatif(cheminPublic: string): string | null {
    return cheminPublic.startsWith('/media/') ? cheminPublic.slice('/media/'.length) : null;
  }

  /**
   * Résout un chemin relatif DANS le volume, et refuse tout ce qui en sort.
   *
   * La garde est redondante avec le tirage au sort du nom de fichier — et
   * c'est voulu : elle tient encore le jour où un appelant passera un chemin
   * d'une autre provenance.
   */
  private cheminDisque(relatif: string): string {
    const nettoye = normalize(relatif);

    // Séparateurs unifiés avant le découpage : `normalize()` rend `a\..\b` sous
    // Windows et `a/../b` ailleurs — la garde doit voir les deux.
    if (isAbsolute(nettoye) || nettoye.replace(/\\/g, '/').split('/').includes('..')) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ECHOUEE,
        'Chemin de média invalide.',
      );
    }

    return join(this.racine, nettoye);
  }
}
