import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import { DatabaseModule } from '@/database/database.module';
import { DemoSeeder } from '@/database/seeders/demo.seeder';
import { ReferentielsSeeder } from '@/database/seeders/referentiels.seeder';
import { PrismaService } from '@/prisma/prisma.service';
import { MaintenanceModule } from '@/modules/maintenance/maintenance.module';
import { PurgesService } from '@/modules/maintenance/purges.service';
import { verifierBaseRedisDeTest } from '../helpers/env';

const JOUR_MS = 24 * 3600 * 1000;
const IL_Y_A_13_MOIS = new Date(Date.now() - 400 * JOUR_MS);
const IL_Y_A_1_MOIS = new Date(Date.now() - 30 * JOUR_MS);
const IL_Y_A_4_ANS = new Date(Date.now() - 4 * 365 * JOUR_MS);

/**
 * Purges de la loi 09-08 — livrable 10 §6.3.
 *
 * CE QUI EST ÉPROUVÉ ICI N'A AUCUN ÉCRAN, et c'est précisément pourquoi ces
 * tests comptent : une purge qui ne tourne pas ne casse rien, n'affiche rien,
 * et la faute grandit en silence jusqu'au contrôle. Trois choses doivent
 * tenir — le seuil, ce qui est épargné, et le fait que rejouer ne double rien.
 */
describe('Purges loi 09-08', () => {
  let moduleRef: TestingModule;
  let db: PrismaService;
  let purges: PurgesService;
  let etablissementId: bigint;

  beforeAll(async () => {
    verifierBaseRedisDeTest(process.env.REDIS_URL ?? '');

    moduleRef = await Test.createTestingModule({
      // `MaintenanceModule` EST IMPORTÉ EXPLICITEMENT : `AppModule` ne le
      // charge pas, et c'est voulu — les purges n'appartiennent qu'au
      // conteneur `scheduler`. Le test monte donc exactement ce qu'il éprouve.
      imports: [AppModule, DatabaseModule, MaintenanceModule],
    }).compile();

    db = moduleRef.get(PrismaService);
    purges = moduleRef.get(PurgesService);

    const referentiels = moduleRef.get(ReferentielsSeeder);
    await referentiels.roles();
    await referentiels.villes();
    await referentiels.niveauxFilieres();

    const demo = moduleRef.get(DemoSeeder);
    const comptes = await demo.comptes();
    const { almassira } = await demo.donnees(comptes);
    etablissementId = almassira.id;
  });

  /**
   * FERMER LE MODULE, PAS SEULEMENT PRISMA. `AppModule` ouvre aussi Redis, et
   * une connexion laissée pendante empêche Jest de rendre la main : la suite
   * entière paraît bloquée alors qu'elle a fini, et l'on cherche la panne
   * ailleurs. `close()` déclenche les `onModuleDestroy`, Redis compris.
   */
  afterAll(async () => {
    await moduleRef.close();
  });

  // ---------------------------------------------------------------------------
  //  Demandes de contact — anonymisation à 12 mois
  // ---------------------------------------------------------------------------

  /**
   * ANONYMISER, PAS SUPPRIMER. La demande alimente les statistiques de contact
   * d'un établissement : la détruire fausserait l'audience qu'il paie pour
   * consulter.
   */
  it('anonymise une demande traitée il y a plus de douze mois, sans la supprimer', async () => {
    const vieille = await db.demandeContact.create({
      data: {
        etablissement_id: etablissementId,
        parent_nom: 'Fatima Zahra',
        parent_tel: '06 11 22 33 44',
        message: 'Je cherche une place en CE2.',
        canal: 'formulaire',
        consentement: true,
        statut: 'traitee',
        recue_le: IL_Y_A_13_MOIS,
        traitee_le: IL_Y_A_13_MOIS,
      },
    });

    await purges.demandes();

    const apres = await db.demandeContact.findUniqueOrThrow({ where: { id: vieille.id } });

    expect(apres.parent_nom).toBe('Anonymisé');
    expect(apres.parent_tel).toBe('');
    expect(apres.message).toBeNull();
    // La ligne existe toujours : c'est elle qui compte dans l'audience.
    expect(apres.etablissement_id).toBe(etablissementId);

    await db.demandeContact.delete({ where: { id: vieille.id } });
  });

  it('épargne une demande récente, et une demande jamais traitée', async () => {
    const recente = await db.demandeContact.create({
      data: {
        etablissement_id: etablissementId,
        parent_nom: 'Karim Récent',
        parent_tel: '06 99 88 77 66',
        canal: 'formulaire',
        consentement: true,
        statut: 'traitee',
        recue_le: IL_Y_A_1_MOIS,
        traitee_le: IL_Y_A_1_MOIS,
      },
    });

    /**
     * JAMAIS TRAITÉE : le délai court depuis `traitee_le`, pas `recue_le`.
     * Compter depuis la réception anonymiserait un dossier encore ouvert, et
     * le secrétariat perdrait de quoi rappeler le parent.
     */
    const ouverte = await db.demandeContact.create({
      data: {
        etablissement_id: etablissementId,
        parent_nom: 'Sara Ouverte',
        parent_tel: '06 55 44 33 22',
        canal: 'formulaire',
        consentement: true,
        statut: 'nouvelle',
        recue_le: IL_Y_A_13_MOIS,
      },
    });

    await purges.demandes();

    expect(
      (await db.demandeContact.findUniqueOrThrow({ where: { id: recente.id } })).parent_nom,
    ).toBe('Karim Récent');
    expect(
      (await db.demandeContact.findUniqueOrThrow({ where: { id: ouverte.id } })).parent_nom,
    ).toBe('Sara Ouverte');

    await db.demandeContact.deleteMany({ where: { id: { in: [recente.id, ouverte.id] } } });
  });

  /** Son compteur doit dire ce qu'elle a fait, pas ce qu'elle a relu. */
  it('ne recompte pas ce qui est déjà anonymisé', async () => {
    const vieille = await db.demandeContact.create({
      data: {
        etablissement_id: etablissementId,
        parent_nom: 'À Anonymiser',
        parent_tel: '06 00 00 00 01',
        canal: 'formulaire',
        consentement: true,
        statut: 'traitee',
        recue_le: IL_Y_A_13_MOIS,
        traitee_le: IL_Y_A_13_MOIS,
      },
    });

    const premier = await purges.demandes();
    const second = await purges.demandes();

    expect(premier).toBeGreaterThanOrEqual(1);
    expect(second).toBe(0);

    await db.demandeContact.delete({ where: { id: vieille.id } });
  });

  // ---------------------------------------------------------------------------
  //  Traces d'audience — agrégation puis suppression à 12 mois
  // ---------------------------------------------------------------------------

  /**
   * AGRÉGER AVANT DE SUPPRIMER. Supprimer d'abord effacerait l'historique
   * d'audience d'un établissement — exactement ce qu'il paie pour voir.
   */
  it('agrège les traces anciennes avant de les supprimer', async () => {
    const jour = new Date(IL_Y_A_13_MOIS);
    jour.setUTCHours(10, 0, 0, 0);

    await db.evenementTrace.createMany({
      data: Array.from({ length: 5 }, () => ({
        etablissement_id: etablissementId,
        type: 'vue' as const,
        survenu_le: jour,
      })),
    });

    const recente = await db.evenementTrace.create({
      data: { etablissement_id: etablissementId, type: 'vue', survenu_le: IL_Y_A_1_MOIS },
    });

    const resultat = await purges.traces();

    expect(resultat.supprimees).toBeGreaterThanOrEqual(5);

    const agregat = await db.statistiqueJournaliere.findFirstOrThrow({
      where: {
        etablissement_id: etablissementId,
        type: 'vue',
        jour: new Date(jour.toISOString().slice(0, 10)),
      },
    });

    expect(agregat.total).toBeGreaterThanOrEqual(5);

    // La trace récente est intacte : le seuil est bien à douze mois.
    expect(await db.evenementTrace.findUnique({ where: { id: recente.id } })).not.toBeNull();

    await db.evenementTrace.delete({ where: { id: recente.id } });
  });

  /**
   * REJOUABLE SANS DOUBLER. Une exécution interrompue entre l'agrégation et la
   * suppression laisse des traces déjà agrégées ; la suivante doit les
   * réécrire à l'identique, pas les additionner.
   */
  it('ne double pas les totaux quand on la rejoue', async () => {
    const jour = new Date(IL_Y_A_13_MOIS);
    jour.setUTCHours(8, 0, 0, 0);
    const cle = new Date(jour.toISOString().slice(0, 10));

    await db.statistiqueJournaliere.deleteMany({
      where: { etablissement_id: etablissementId, type: 'appel', jour: cle },
    });

    await db.evenementTrace.createMany({
      data: Array.from({ length: 3 }, () => ({
        etablissement_id: etablissementId,
        type: 'appel' as const,
        survenu_le: jour,
      })),
    });

    await purges.traces();

    const premier = await db.statistiqueJournaliere.findFirstOrThrow({
      where: { etablissement_id: etablissementId, type: 'appel', jour: cle },
    });

    // Les lignes brutes sont parties : la seconde exécution n'a plus rien à
    // agréger, et le total doit rester celui-là.
    await purges.traces();

    const second = await db.statistiqueJournaliere.findFirstOrThrow({
      where: { etablissement_id: etablissementId, type: 'appel', jour: cle },
    });

    expect(second.total).toBe(premier.total);
  });

  // ---------------------------------------------------------------------------
  //  Journal d'audit — trois ans (RG26)
  // ---------------------------------------------------------------------------

  it('supprime les entrées de plus de trois ans, épargne les récentes', async () => {
    const vieille = await db.journalAudit.create({
      data: {
        role_acteur: 'superadmin',
        action: 'test.vieille',
        cible_type: 'test',
        cible_id: 1n,
        cree_le: IL_Y_A_4_ANS,
      },
    });

    const recente = await db.journalAudit.create({
      data: {
        role_acteur: 'superadmin',
        action: 'test.recente',
        cible_type: 'test',
        cible_id: 1n,
      },
    });

    await purges.purgerAudit();

    expect(await db.journalAudit.findUnique({ where: { id: vieille.id } })).toBeNull();
    expect(await db.journalAudit.findUnique({ where: { id: recente.id } })).not.toBeNull();

    await db.journalAudit.delete({ where: { id: recente.id } });
  });

  // ---------------------------------------------------------------------------
  //  Traçabilité — c'est le journal qui prouvera que les purges tournent
  // ---------------------------------------------------------------------------

  /**
   * LE JOUR OÙ LA CNDP DEMANDE LA PREUVE, c'est le journal qui répond. Un
   * compteur à zéro est une réponse aussi valable qu'un compteur à mille —
   * l'absence d'entrée, non.
   */
  it('journalise chaque exécution sous l’acteur « systeme », sans cible', async () => {
    await purges.demandes();

    const trace = await db.journalAudit.findFirstOrThrow({
      where: { action: 'purge.demandes' },
      orderBy: { id: 'desc' },
    });

    expect(trace.user_id).toBeNull();
    expect(trace.role_acteur).toBe('systeme');
    expect(trace.cible_id).toBeNull();
    expect(trace.details).toHaveProperty('lignes');
    expect(trace.details).toHaveProperty('seuil');
  });
});
