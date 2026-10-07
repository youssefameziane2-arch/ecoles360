import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProspectSource, ProspectStatut } from '../../generated/prisma';
import { InscriptionDto } from './dto/inscription.dto';

/**
 * Demandes de référencement venues du site public — RG17.
 *
 * LE PROSPECT NAÎT SANS COMMERCIAL, en `nouveau`. C'est exactement l'état que
 * le pipeline attend : la colonne « Nouveaux » de l'écran CRM est faite pour
 * ça, et l'attribution est un acte d'administration (RG17), pas un effet de
 * bord d'un formulaire public. Le choisir ici — au hasard, ou au premier de la
 * liste — donnerait un dossier à quelqu'un sans que personne ne l'ait décidé,
 * et la commission qui en découlerait (RG18) serait le fruit de ce hasard.
 *
 * AUCUNE FICHE N'EST CRÉÉE. Une demande d'inscription n'est pas un
 * établissement : la fiche naît quand l'administration la crée, après contact
 * (RG20). En créer une ici ferait apparaître sur le site public, en
 * `en_attente`, le nom de toute école qu'un plaisantin aurait saisie.
 */
@Injectable()
export class InscriptionsService {
  private readonly logger = new Logger('Inscriptions');

  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async deposer(dto: InscriptionDto) {
    const prospect = await this.db.prospect.create({
      data: {
        etablissement_nom: dto.etablissement_nom,
        ville: dto.ville ?? null,
        type_vise: dto.type_vise ?? null,
        contact_nom: dto.contact_nom,
        contact_fonction: dto.contact_fonction ?? null,
        telephone: dto.telephone,
        email: dto.email ?? null,
        formule_visee: dto.formule_visee ?? null,
        message: dto.message ?? null,
        consentement: dto.consentement,
        source: ProspectSource.formulaire,
        statut_pipeline: ProspectStatut.nouveau,
      },
      select: { id: true, etablissement_nom: true, cree_le: true },
    });

    /**
     * JOURNALISÉ SOUS L'ACTEUR « systeme » : aucun humain de la maison n'a
     * cliqué, l'acte vient d'internet.
     *
     * SANS L'ADRESSE IP, bien que la colonne existe. Une IP est une donnée
     * personnelle, et la garder trois ans pour une demande légitime
     * contredirait la minimisation appliquée partout ailleurs. La limitation
     * de débit suffit à freiner les envois automatisés ; ce qu'elle laisse
     * passer se voit dans la colonne « Nouveaux » du CRM, pas dans un journal.
     */
    await this.audit.journaliser(this.db, {
      userId: null,
      roleActeur: 'systeme',
      action: 'inscription.deposee',
      cibleType: 'prospect',
      cibleId: prospect.id,
      details: {
        etablissement_nom: prospect.etablissement_nom,
        formule_visee: dto.formule_visee ?? null,
        consentement: dto.consentement,
      },
    });

    this.logger.log(`Demande de référencement — ${prospect.etablissement_nom}`);

    /**
     * LA RÉPONSE NE REND PAS L'IDENTIFIANT. Il n'ouvre aucun écran côté
     * visiteur, et le publier donnerait le compte des demandes reçues à
     * quiconque en déposerait deux — une information commerciale que rien
     * n'oblige à donner.
     */
    return {
      recue_le: prospect.cree_le,
      message: 'Votre demande est enregistrée. Un conseiller vous rappelle sous 48 heures ouvrées.',
    };
  }
}
