import type { NotificationType } from '../../generated/prisma';
import type { Courriel } from './mail.service';

/**
 * Modèles des courriels — B-53.
 *
 * ÉCRITS À LA MAIN, SANS MOTEUR DE GABARITS. Six messages courts, dont le
 * corps tient en deux phrases : Handlebars ou Pug ajouteraient une dépendance,
 * un dossier de fichiers à embarquer dans l'image Docker, et un deuxième
 * endroit où se tromper de chemin. Le jour où le client veut des courriels
 * illustrés, ce fichier devient le point de bascule — pas vingt appels
 * éparpillés.
 *
 * CHAQUE MESSAGE DIT OÙ ALLER. Un courriel qui annonce un avis à modérer sans
 * lien vers l'écran de modération oblige à chercher : on ouvre le site, on se
 * connecte, on cherche la bonne rubrique. Le lien est la moitié de l'utilité.
 *
 * AUCUNE DONNÉE PERSONNELLE DANS LE SUJET. Le sujet d'un courriel voyage en
 * clair dans les journaux de tous les serveurs qu'il traverse ; le nom d'un
 * parent qui dépose un avis n'a rien à y faire. Il reste dans le corps, qui
 * voyage chiffré.
 */

/** Où mène chaque type — le pendant serveur de `DESTINATION` côté front. */
const CHEMIN: Record<NotificationType, { administration: string; etablissement: string }> = {
  demande: { administration: '/admin/etablissements', etablissement: '/espace/demandes' },
  moderation: { administration: '/admin/avis', etablissement: '/espace/avis' },
  proposition_fiche: { administration: '/admin/propositions', etablissement: '/espace/fiche' },
  echeance_abonnement: {
    administration: '/admin/facturation',
    etablissement: '/espace/facturation',
  },
  plafond_vue_atteint: {
    administration: '/admin/facturation',
    etablissement: '/espace/facturation',
  },
};

/** Le sujet par type — volontairement neutre, voir l'en-tête. */
const SUJET: Record<NotificationType, string> = {
  demande: 'Nouvelle demande de contact',
  moderation: 'Un avis attend votre modération',
  proposition_fiche: 'Une modification de fiche attend sa validation',
  echeance_abonnement: 'Votre abonnement arrive à échéance',
  plafond_vue_atteint: 'Plafond de vues atteint',
};

export interface ContexteNotification {
  type: NotificationType;
  /** Le texte déjà affiché dans la cloche — on ne le réécrit pas. */
  contenu: string;
  /** Décide du lien : l'administration et l'établissement n'ont pas le même écran. */
  administration: boolean;
  /** Racine publique du site, sans barre oblique finale. */
  appUrl: string;
}

/** Le courriel correspondant à une notification du centre. */
export function modeleNotification(destinataire: string, contexte: ContexteNotification): Courriel {
  const chemin = CHEMIN[contexte.type];
  const lien = `${contexte.appUrl}${contexte.administration ? chemin.administration : chemin.etablissement}`;

  return {
    a: destinataire,
    sujet: `écoles360 — ${SUJET[contexte.type]}`,
    ...corps({
      titre: SUJET[contexte.type],
      paragraphe: contexte.contenu,
      lien,
      libelleLien: 'Ouvrir écoles360',
    }),
  };
}

/**
 * Réinitialisation de mot de passe.
 *
 * LE SEUL COURRIEL DONT L'ABSENCE EMPÊCHE D'UTILISER LE PRODUIT. Les autres
 * doublent une notification déjà visible ; celui-ci porte un jeton qui
 * n'existe nulle part ailleurs. Tant que le compte SMTP manque, l'écran de
 * connexion dit « écrivez-nous » — et c'est la seule réponse honnête.
 *
 * LE LIEN EST LA SEULE CHOSE QUE LE MESSAGE CONTIENT. Pas de « votre nouveau
 * mot de passe est… » : un mot de passe envoyé par courriel reste lisible dans
 * la boîte de réception pour toujours.
 */
export function modeleReinitialisation(
  destinataire: string,
  lien: string,
  heuresValidite: number,
): Courriel {
  return {
    a: destinataire,
    sujet: 'écoles360 — Réinitialisation de votre mot de passe',
    ...corps({
      titre: 'Réinitialisation de votre mot de passe',
      paragraphe:
        `Vous avez demandé à changer votre mot de passe. Le lien ci-dessous est valable ` +
        `${heuresValidite} heure${heuresValidite > 1 ? 's' : ''} et ne fonctionne qu'une fois.`,
      lien,
      libelleLien: 'Choisir un nouveau mot de passe',
      postScriptum:
        "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe actuel reste valable.",
    }),
  };
}

/**
 * La mise en page commune — texte et HTML produits ensemble.
 *
 * LES DEUX VERSIONS SONT ÉCRITES AU MÊME ENDROIT pour qu'elles ne divergent
 * pas. Les générer séparément garantit qu'un jour l'une dira une chose et
 * l'autre une autre, et que personne ne s'en apercevra — presque plus
 * personne ne lit la version texte, mais les filtres antispam, eux, la lisent.
 *
 * TOUT EN LIGNE, SANS FEUILLE DE STYLE. Les clients de messagerie ignorent
 * `<style>` aussi souvent qu'ils l'honorent, et Gmail retire les balises de
 * tête. Une mise en forme discrète qui survit partout vaut mieux qu'une belle
 * qui s'effondre chez un destinataire sur trois.
 */
function corps(contenu: {
  titre: string;
  paragraphe: string;
  lien: string;
  libelleLien: string;
  postScriptum?: string;
}): { texte: string; html: string } {
  const texte = [
    contenu.titre,
    '',
    contenu.paragraphe,
    '',
    contenu.lien,
    ...(contenu.postScriptum ? ['', contenu.postScriptum] : []),
    '',
    '— écoles360, l’annuaire des établissements scolaires privés au Maroc',
  ].join('\n');

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${echapper(contenu.titre)}</title></head>
<body style="margin:0;padding:24px;background:#FBFAF7;font-family:Arial,Helvetica,sans-serif;color:#2A313B;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #EAE6DE;border-radius:14px;">
    <tr><td style="padding:28px 30px;">
      <p style="margin:0 0 18px;font-size:13px;font-weight:bold;letter-spacing:1px;color:#E63946;">ÉCOLES360</p>
      <h1 style="margin:0 0 14px;font-size:19px;line-height:1.3;color:#1D3557;">${echapper(contenu.titre)}</h1>
      <p style="margin:0 0 22px;font-size:14px;line-height:1.6;">${echapper(contenu.paragraphe)}</p>
      <a href="${echapper(contenu.lien)}" style="display:inline-block;background:#E63946;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 22px;border-radius:10px;">${echapper(contenu.libelleLien)}</a>
      <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#9AA3AF;word-break:break-all;">Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :<br>${echapper(contenu.lien)}</p>
      ${contenu.postScriptum ? `<p style="margin:16px 0 0;font-size:12.5px;line-height:1.6;color:#5A6472;">${echapper(contenu.postScriptum)}</p>` : ''}
    </td></tr>
  </table>
  <p style="max-width:520px;margin:16px auto 0;font-size:11.5px;line-height:1.6;color:#9AA3AF;text-align:center;">écoles360 — l’annuaire des établissements scolaires privés au Maroc</p>
</body></html>`;

  return { texte, html };
}

/**
 * Échappement HTML.
 *
 * LE CONTENU VIENT DE LA BASE, donc d'un nom d'établissement ou d'un libellé
 * qu'un humain a saisi. Une apostrophe typographique ne pose rien, mais un
 * `<` dans un nom casserait la mise en page, et une balise glissée dans un
 * champ libre partirait dans la boîte de réception d'un administrateur.
 */
function echapper(valeur: string): string {
  return valeur
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
