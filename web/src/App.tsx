import { Route, Routes, useLocation } from 'react-router-dom';
import { EnTete } from './components/EnTete';
import { PiedDePage } from './components/PiedDePage';
import { MobilierAssistance } from './components/MobilierAssistance';
import { Accueil } from './pages/Accueil';
import { Resultats } from './pages/Resultats';
import { Fiche } from './pages/Fiche';
import { Ville } from './pages/Ville';
import { APropos } from './pages/APropos';
import { PageLegale } from './pages/PageLegale';
import { Faq } from './pages/Faq';
import { Blog } from './pages/Blog';
import { Article } from './pages/Article';
import { Connexion } from './pages/Connexion';
import { InscriptionEtablissement } from './pages/InscriptionEtablissement';
import { Introuvable } from './pages/Introuvable';
import { TableauDeBordEspace } from './pages/espace/TableauDeBord';
import { FicheEditeur } from './pages/espace/FicheEditeur';
import { AvisEspacePage } from './pages/espace/AvisEspace';
import { DemandesEspacePage } from './pages/espace/DemandesEspace';
import { EtablissementsAdmin } from './pages/admin/EtablissementsAdmin';
import { TableauDeBordAdmin } from './pages/admin/TableauDeBordAdmin';
import { PropositionsAdmin } from './pages/admin/PropositionsAdmin';
import { ParametresFacturation } from './pages/admin/ParametresFacturation';
import { FacturationAdmin } from './pages/admin/FacturationAdmin';
import { CrmAdmin } from './pages/admin/CrmAdmin';
import { CommerciauxAdmin } from './pages/admin/CommerciauxAdmin';
import {
  AgendaCommercial,
  LeadsCommercial,
  TableauDeBordCommercial,
  TransfertsCommercial,
} from './pages/commercial/EspaceCommercial';
import { SponsoringsAdmin } from './pages/admin/SponsoringsAdmin';
import { ContenuAdmin } from './pages/admin/ContenuAdmin';
import { BlogAdmin, BlogEspace } from './pages/espace/Blog';
import { AvisAdmin } from './pages/admin/AvisAdmin';
import { JournalAdmin } from './pages/admin/JournalAdmin';
import { SecretariatAdmin } from './pages/admin/SecretariatAdmin';
import { StatistiquesAdmin } from './pages/admin/StatistiquesAdmin';
import { StatistiquesEspace } from './pages/espace/StatistiquesEspace';
import { FacturationEspace, StatistiquesCommercial } from './pages/espace/ModulesAVenir';

/**
 * Routage — livrable 12 §3.
 *
 * DEUX FAMILLES D'ÉCRANS, DEUX HABILLAGES. Le site public porte l'en-tête et
 * le pied de page ; les espaces connectés ont leur propre coquille à
 * navigation latérale (`CoquilleEspace`) et ne doivent surtout pas hériter de
 * la navigation publique — la maquette les traite comme deux applications
 * distinctes servies au même domaine.
 */
export function App() {
  const { pathname } = useLocation();
  // Un espace oublié ici serait rendu DANS le site public — en-tête, pied de
  // page et bannière d'aide autour d'une coquille qui a déjà sa navigation.
  const connecte =
    pathname.startsWith('/espace') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/commercial');

  // La connexion occupe l'écran entier, panneau de marque compris : elle ne
  // porte donc ni l'en-tête ni le pied de page du site public.
  if (pathname === '/connexion') {
    return <Connexion />;
  }

  if (connecte) {
    return (
      <Routes>
        <Route path="/espace" element={<TableauDeBordEspace />} />
        <Route path="/espace/fiche" element={<FicheEditeur />} />
        <Route path="/espace/avis" element={<AvisEspacePage />} />
        <Route path="/espace/demandes" element={<DemandesEspacePage />} />
        <Route path="/espace/statistiques" element={<StatistiquesEspace />} />
        <Route path="/espace/blog" element={<BlogEspace />} />
        <Route path="/espace/facturation" element={<FacturationEspace />} />

        <Route path="/admin" element={<TableauDeBordAdmin />} />
        <Route path="/admin/etablissements" element={<EtablissementsAdmin />} />
        <Route path="/admin/propositions" element={<PropositionsAdmin />} />
        <Route path="/admin/secretariat" element={<SecretariatAdmin />} />
        <Route path="/admin/commerciaux" element={<CommerciauxAdmin />} />
        <Route path="/admin/crm" element={<CrmAdmin />} />
        <Route path="/admin/facturation" element={<FacturationAdmin />} />
        <Route path="/admin/avis" element={<AvisAdmin />} />
        <Route path="/admin/blog" element={<BlogAdmin />} />
        <Route path="/admin/contenu" element={<ContenuAdmin />} />
        <Route path="/admin/statistiques" element={<StatistiquesAdmin />} />
        <Route path="/admin/journal" element={<JournalAdmin />} />
        <Route path="/admin/sponsorings" element={<SponsoringsAdmin />} />
        <Route path="/admin/parametres" element={<ParametresFacturation />} />

        <Route path="/commercial" element={<TableauDeBordCommercial />} />
        <Route path="/commercial/agenda" element={<AgendaCommercial />} />
        <Route path="/commercial/leads" element={<LeadsCommercial />} />
        <Route path="/commercial/transferts" element={<TransfertsCommercial />} />
        <Route path="/commercial/statistiques" element={<StatistiquesCommercial />} />
        <Route path="/commercial/blog" element={<BlogEspace />} />

        <Route path="*" element={<Introuvable />} />
      </Routes>
    );
  }

  return (
    <>
      <EnTete />
      <main>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/etablissements" element={<Resultats />} />
          <Route path="/etablissements/:slug" element={<Fiche />} />
          <Route path="/villes/:slug" element={<Ville />} />
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<Article />} />
          <Route path="/inscription-etablissement" element={<InscriptionEtablissement />} />
          {/*
            Trois routes, un composant : ces pages ne diffèrent que par leur
            clé CMS. La description sert la balise <meta>, que le CMS ne porte
            pas — elle décrit le rôle de la page, pas son contenu, et n'a donc
            pas à changer quand le juriste réécrit le texte.
          */}
          <Route
            path="/mentions-legales"
            element={
              <PageLegale
                cle="mentions-legales"
                description="Éditeur, hébergement et responsabilité du site écoles360."
              />
            }
          />
          <Route
            path="/confidentialite"
            element={
              <PageLegale
                cle="confidentialite"
                description="Données collectées, finalités, durées de conservation et vos droits (loi 09-08)."
              />
            }
          />
          <Route
            path="/cookies"
            element={
              <PageLegale
                cle="cookies"
                description="Cookies utilisés par écoles360 et moyens de les refuser."
              />
            }
          />
          <Route path="*" element={<Introuvable />} />
        </Routes>
      </main>
      <PiedDePage />
      {/* Bannière d'aide et bouton WhatsApp : mobilier fixe du site public,
          posé par la maquette en bas d'écran, au-dessus de tout le reste. */}
      <MobilierAssistance />
    </>
  );
}
