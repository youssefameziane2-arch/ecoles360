import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleCode, UserStatut } from '../../generated/prisma';

/**
 * Conseillers commerciaux joignables — bannière d'aide du site public.
 *
 * NE REND QUE LES COMPTES ACTIFS QUI ONT UNE LIGNE. Un conseiller suspendu ou
 * sans téléphone ne doit pas apparaître : afficher un numéro qui ne répond pas
 * est pire que ne rien afficher, parce que le visiteur croit avoir essayé.
 *
 * NI ADRESSE NI IDENTIFIANT : le nom et le numéro suffisent à la bannière, et
 * l'e-mail d'un salarié n'a rien à faire dans une réponse publique.
 */
@Injectable()
export class ConseillersService {
  constructor(private readonly db: PrismaService) {}

  async joignables() {
    const conseillers = await this.db.user.findMany({
      where: {
        statut: UserStatut.actif,
        telephone: { not: null },
        role: { code: RoleCode.commercial },
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, telephone: true },
    });

    return conseillers.map((conseiller) => ({
      id: conseiller.id.toString(),
      nom: conseiller.name,
      telephone: conseiller.telephone as string,
    }));
  }
}
