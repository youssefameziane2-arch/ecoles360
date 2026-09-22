import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppException, ERROR_CODES } from '../../common/errors';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DemandeStatut,
  EtablissementStatut,
  EvenementType,
  LeadSource,
  LeadUrgence,
} from '../../generated/prisma';
import type { DemandeContactDto } from './dto/demande-contact.dto';
import type { TracerEvenementDto } from './dto/tracer-evenement.dto';

/**
 * Mise en relation et traçage — livrable 11 §3.1, RG09 à RG12.
 *
 * TOUTE DEMANDE DEVIENT UN LEAD (RG21). La demande et son lead naissent dans
 * la même transaction : un lead perdu, c'est un parent que l'établissement ne
 * rappellera jamais, et le CRM de l'avenant 1 repose entièrement sur cette
 * création automatique.
 *
 * LE CONSENTEMENT EST UNE CONDITION, PAS UN CHAMP (RG09). Le DTO le refuse à
 * `false` ; la donnée personnelle n'est donc jamais écrite sans lui. C'est la
 * loi 09-08, pas une préférence produit.
 */
@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(private readonly db: PrismaService) {}

  /**
   * Demande de contact déposée depuis une fiche publique.
   *
   * Le lead est créé avec un score initial calculé sur ce qu'on sait — c'est
   * peu, mais assez pour que l'établissement voie une file ordonnée plutôt
   * qu'un tas (RG22).
   */
  async deposerDemande(slug: string, dto: DemandeContactDto): Promise<{ id: bigint }> {
    const etablissement = await this.fichePubliee(slug);

    const demande = await this.db.$transaction(async (tx) => {
      const creee = await tx.demandeContact.create({
        data: {
          etablissement_id: etablissement.id,
          parent_nom: dto.parent_nom,
          parent_tel: dto.parent_tel,
          message: dto.message,
          canal: dto.canal,
          consentement: dto.consentement, // toujours true — le DTO refuse false
          statut: DemandeStatut.nouvelle,
        },
        select: { id: true },
      });

      // RG21 — le lead naît avec la demande, dans la même transaction.
      await tx.lead.create({
        data: {
          etablissement_id: etablissement.id,
          demande_contact_id: creee.id,
          candidat_nom: dto.parent_nom,
          tel: dto.parent_tel,
          whatsapp: dto.canal === 'whatsapp',
          urgence: LeadUrgence.flexible, // inconnue à ce stade, à préciser dans la fiche de besoin
          source: LeadSource.ecoles360,
          score: this.scoreInitial(dto),
          fiche_besoin: { message_initial: dto.message ?? null, canal: dto.canal },
        },
      });

      return creee;
    });

    // LOT 6 — les jobs BullMQ `mail` et `alerts` notifieront l'établissement et
    // le secrétariat (livrable 11 §6). En attendant, la demande est enregistrée
    // et visible dans la file : rien n'est perdu, seule la notification manque.
    this.logger.log(`Demande ${demande.id} reçue sur ${slug}, lead créé`);

    return demande;
  }

  /**
   * Traçage d'une interaction — RG10.
   *
   * Volontairement sans authentification et sans corps de réponse : c'est un
   * appel de télémétrie déclenché par un clic, il doit être aussi léger que
   * possible et ne jamais bloquer l'interface.
   *
   * Seule la vue de page profil (`type=vue`, `source=fiche`) alimentera la
   * facturation à la vue (RG12) — ce comptage, avec son verrou de ligne et son
   * plafond mensuel, arrive au lot facturation.
   */
  async tracer(slug: string, dto: TracerEvenementDto): Promise<void> {
    const etablissement = await this.fichePubliee(slug);

    await this.db.evenementTrace.create({
      data: {
        etablissement_id: etablissement.id,
        type: dto.type,
        source: dto.source,
      },
    });

    if (dto.type === EvenementType.vue && dto.source === 'fiche') {
      // Marqueur explicite du point de raccordement : c'est ici que
      // ViewBillingService viendra se brancher (livrable 11 §4, RG12).
      this.logger.debug(`Vue facturable potentielle sur ${slug}`);
    }
  }

  /**
   * Score initial d'un lead issu du site — RG22.
   *
   * Barème du livrable 11 §4 : urgence 0–4, budget 0–3, complétude 0–3. À la
   * réception d'une demande, urgence et budget sont inconnus ; seule la
   * complétude est mesurable. Le score reste donc bas et sera recalculé dès que
   * la fiche de besoin sera remplie — un score faible signifie « à qualifier »,
   * pas « sans intérêt ».
   */
  private scoreInitial(dto: DemandeContactDto): number {
    let complétude = 1; // nom et téléphone sont obligatoires

    if (dto.message && dto.message.trim().length > 20) {
      complétude += 1; // un message circonstancié dit quelque chose du besoin
    }

    if (dto.canal === 'whatsapp' || dto.canal === 'appel') {
      complétude += 1; // un canal direct traduit une intention plus forte
    }

    return Math.min(complétude, 3);
  }

  private async fichePubliee(slug: string): Promise<{ id: bigint }> {
    const etablissement = await this.db.etablissement.findFirst({
      where: { slug, statut: EtablissementStatut.validee },
      select: { id: true },
    });

    if (!etablissement) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESSOURCE_INTROUVABLE,
        "Cet établissement n'existe pas ou n'est pas encore publié.",
      );
    }

    return etablissement;
  }
}
