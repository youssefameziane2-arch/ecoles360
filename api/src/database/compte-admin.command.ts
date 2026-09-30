import { Injectable, Logger } from '@nestjs/common';
import { Algorithm, hash } from '@node-rs/argon2';
import { randomBytes } from 'node:crypto';
import { Command, CommandRunner, Option } from 'nest-commander';
import { PrismaService } from '../prisma/prisma.service';
import { RoleCode } from '../generated/prisma';

interface Options {
  nom?: string;
}

/**
 * `compte:admin <email>` — crée le premier administrateur, ou réinitialise
 * son mot de passe.
 *
 * ÉCRITE PARCE QUE LA PRODUCTION N'AVAIT AUCUN MOYEN DE SE CONNECTER. Sous
 * `NODE_ENV=production`, `db:seed` pose les référentiels et s'arrête là :
 * aucun compte n'est créé, à raison — ceux de démonstration ont des mots de
 * passe connus. Mais rien ne prenait le relais. Un site fraîchement déployé
 * affichait donc son back-office sans que personne au monde puisse y entrer,
 * et la seule issue aurait été d'écrire un hachage Argon2 à la main en SQL.
 *
 * Sert aussi au développement : le semis NE RÉÉCRIT JAMAIS le mot de passe
 * d'un compte existant, pour ne pas effacer celui qu'un développeur s'est
 * choisi. Cette commande est donc le seul chemin pour en changer.
 *
 *   node dist/cli.js compte:admin direction@ecoles360.com --nom="Direction"
 *
 * LE MOT DE PASSE NE SE DONNE PAS EN ARGUMENT : la ligne de commande se
 * retrouve dans l'historique du shell et dans `ps`, lisible par tout autre
 * compte de la machine. Il est lu dans `COMPTE_MOT_DE_PASSE` si la variable
 * existe, et sinon TIRÉ AU SORT puis affiché une seule fois.
 */
@Injectable()
@Command({
  name: 'compte:admin',
  arguments: '<email>',
  description: 'Crée un compte Super Admin, ou réinitialise son mot de passe',
})
export class CompteAdminCommand extends CommandRunner {
  private readonly logger = new Logger('CompteAdmin');

  constructor(private readonly db: PrismaService) {
    super();
  }

  @Option({ flags: '--nom <nom>', description: 'Nom affiché (création seulement)' })
  parseNom(valeur: string): string {
    return valeur;
  }

  async run([email]: string[], options: Options): Promise<void> {
    const adresse = (email ?? '').trim().toLowerCase();

    if (!adresse.includes('@')) {
      throw new Error(`Adresse invalide : « ${email} ».`);
    }

    const fourni = process.env.COMPTE_MOT_DE_PASSE?.trim();

    if (fourni && fourni.length < 12) {
      throw new Error('COMPTE_MOT_DE_PASSE doit faire au moins 12 caractères.');
    }

    // 24 octets en base64url : de quoi résister à une attaque en ligne sans
    // qu'on ait à juger de la « force » d'un mot de passe choisi à la hâte le
    // jour d'une mise en service.
    const motDePasse = fourni || randomBytes(18).toString('base64url');

    const role = await this.db.role.findUnique({ where: { code: RoleCode.superadmin } });

    if (!role) {
      throw new Error('Le rôle superadmin n’existe pas : lancez d’abord « db:seed ».');
    }

    const passwordHash = await hash(motDePasse, { algorithm: Algorithm.Argon2id });
    const existant = await this.db.user.findUnique({ where: { email: adresse } });

    if (existant) {
      // Le rôle et le statut sont remis d'aplomb en même temps : cette
      // commande est le recours quand plus personne ne peut entrer, et un
      // compte suspendu ou rétrogradé ne rendrait pas l'accès malgré un
      // mot de passe tout neuf.
      await this.db.user.update({
        where: { id: existant.id },
        data: { passwordHash, role_id: role.id, statut: 'actif' },
      });

      this.logger.log(`Mot de passe réinitialisé pour ${adresse} (rôle superadmin, actif).`);
    } else {
      await this.db.user.create({
        data: {
          email: adresse,
          name: options.nom?.trim() || 'Administration',
          role_id: role.id,
          passwordHash,
          statut: 'actif',
        },
      });

      this.logger.log(`Compte Super Admin créé : ${adresse}`);
    }

    if (fourni) {
      this.logger.log('Mot de passe : celui de COMPTE_MOT_DE_PASSE.');
      return;
    }

    // AFFICHÉ UNE SEULE FOIS, et nulle part ailleurs : il n'est pas stocké en
    // clair, et la base n'en garde qu'un hachage Argon2id.
    this.logger.warn(`Mot de passe tiré au sort — notez-le maintenant : ${motDePasse}`);
  }
}
