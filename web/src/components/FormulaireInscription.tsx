import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { chargerVilles, LIBELLE_TYPE, type TypeEtablissement } from '@/api/etablissements';
import {
  deposerInscription,
  FORMULES,
  type DemandeInscription,
  type Formule,
} from '@/api/inscriptions';
import { ApiError } from '@/api/client';
import { Button, Checkbox, Icon, Input, Select, Stepper, Textarea } from '@/ds/composants';

const ETAPES = [{ label: 'Votre établissement' }, { label: 'Votre contact' }];

/**
 * Formulaire public d'inscription — maquette `isInscription`, en deux étapes.
 *
 * EN DEUX ÉTAPES PARCE QUE LA MAQUETTE LE VEUT, et la raison tient : la
 * première ne demande que ce qu'un directeur sait par cœur. Lui présenter d'un
 * bloc onze champs dont son e-mail et sa fonction ferait reculer ceux qui
 * hésitent — or ce formulaire existe pour eux.
 *
 * LA VALIDATION DU SERVEUR FAIT FOI. Les contrôles ici ne servent qu'à éviter
 * un aller-retour : le motif du téléphone est celui du DTO, à la lettre. S'ils
 * divergeaient, c'est le serveur qui gagnerait — et le visiteur verrait un
 * champ accepté localement puis refusé sans explication.
 */
export function FormulaireInscription() {
  const [etape, setEtape] = useState(0);
  const [champs, setChamps] = useState({
    etablissement_nom: '',
    ville: '',
    type_vise: '',
    contact_nom: '',
    contact_fonction: '',
    telephone: '',
    email: '',
    formule_visee: '',
    message: '',
  });
  const [consentement, setConsentement] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  const villes = useQuery({ queryKey: ['villes'], queryFn: chargerVilles });

  const envoi = useMutation({
    mutationFn: (demande: DemandeInscription) => deposerInscription(demande),
  });

  const poser = (nom: keyof typeof champs) => (valeur: string) => {
    setChamps((precedents) => ({ ...precedents, [nom]: valeur }));
    setErreurs(({ [nom]: _ignore, ...reste }) => reste);
  };

  // Le motif du DTO serveur, à la lettre : 06/07 mobile, 05 fixe, avec ou sans
  // +212, espaces et tirets tolérés.
  const telephoneValide = (valeur: string) =>
    /^(?:\+212[\s-]?|0)([5-7])[\s-]?(\d[\s-]?){8}$/.test(valeur.trim());

  function validerEtape1() {
    const trouvees: Record<string, string> = {};

    if (!champs.etablissement_nom.trim()) {
      trouvees.etablissement_nom = 'Le nom de votre établissement est obligatoire.';
    }

    setErreurs(trouvees);

    if (Object.keys(trouvees).length === 0) setEtape(1);
  }

  function envoyer() {
    const trouvees: Record<string, string> = {};

    if (!champs.contact_nom.trim()) trouvees.contact_nom = 'Votre nom est obligatoire.';
    if (!champs.telephone.trim()) {
      trouvees.telephone = 'Votre téléphone est obligatoire.';
    } else if (!telephoneValide(champs.telephone)) {
      trouvees.telephone = 'Le numéro de téléphone marocain est invalide.';
    }
    if (!consentement) {
      trouvees.consentement = 'Votre consentement est nécessaire pour envoyer la demande.';
    }

    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    /**
     * LES CHAMPS VIDES SONT OMIS, pas envoyés vides. Le DTO les déclare
     * facultatifs ; une chaîne vide passerait `@IsOptional()` et atterrirait
     * en base, où un commercial lirait une ville « » plutôt qu'une ville
     * absente.
     */
    const demande: DemandeInscription = {
      etablissement_nom: champs.etablissement_nom.trim(),
      contact_nom: champs.contact_nom.trim(),
      telephone: champs.telephone.trim(),
      consentement: true,
      ...(champs.ville ? { ville: champs.ville } : {}),
      ...(champs.type_vise ? { type_vise: champs.type_vise as TypeEtablissement } : {}),
      ...(champs.contact_fonction.trim()
        ? { contact_fonction: champs.contact_fonction.trim() }
        : {}),
      ...(champs.email.trim() ? { email: champs.email.trim() } : {}),
      ...(champs.formule_visee ? { formule_visee: champs.formule_visee as Formule } : {}),
      ...(champs.message.trim() ? { message: champs.message.trim() } : {}),
    };

    envoi.mutate(demande);
  }

  if (envoi.isSuccess) {
    return <Confirmation message={envoi.data.message} onRecommencer={() => recommencer()} />;
  }

  function recommencer() {
    envoi.reset();
    setChamps({
      etablissement_nom: '',
      ville: '',
      type_vise: '',
      contact_nom: '',
      contact_fonction: '',
      telephone: '',
      email: '',
      formule_visee: '',
      message: '',
    });
    setConsentement(false);
    setErreurs({});
    setEtape(0);
  }

  return (
    <section id="formulaire" style={{ maxWidth: 680, margin: '72px auto 0', padding: '0 32px' }}>
      <h2
        style={{
          margin: 0,
          font: "800 30px/1.2 'Inter', sans-serif",
          letterSpacing: '-0.8px',
          textAlign: 'center',
        }}
      >
        Créer ma fiche établissement
      </h2>

      <div style={{ margin: '26px 0 24px' }}>
        <Stepper steps={ETAPES} current={etape} />
      </div>

      <div style={{ background: '#fff', border: '1px solid #EAE6DE', borderRadius: 18, padding: 28 }}>
        {etape === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Surtitre>Votre établissement</Surtitre>

            <Input
              label="Nom de l’établissement"
              required
              placeholder="Groupe Scolaire Al Massira"
              value={champs.etablissement_nom}
              error={erreurs.etablissement_nom}
              onChange={(e) => poser('etablissement_nom')(e.target.value)}
            />

            <Select
              label="Type d’établissement"
              value={champs.type_vise}
              placeholder="Choisissez un type"
              options={Object.entries(LIBELLE_TYPE).map(([valeur, libelle]) => ({
                value: valeur,
                label: libelle,
              }))}
              onChange={(e) => poser('type_vise')(e.target.value)}
            />

            {/*
              LES VILLES VIENNENT DE LA BASE, pas du `CitySelect` du design
              system : sa liste de douze villes est figée dans le composant et
              a déjà divergé du référentiel (CORRECTIFS.md §5).
            */}
            <Select
              label="Ville"
              value={champs.ville}
              placeholder="Choisissez une ville"
              options={(villes.data ?? []).map((ville) => ({
                value: ville.nom,
                label: ville.nom,
              }))}
              onChange={(e) => poser('ville')(e.target.value)}
            />

            <Button onClick={validerEtape1}>Continuer l’inscription</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Surtitre>Votre contact</Surtitre>

            <Input
              label="Votre nom"
              required
              placeholder="Jalal El Amrani"
              value={champs.contact_nom}
              error={erreurs.contact_nom}
              autoComplete="name"
              onChange={(e) => poser('contact_nom')(e.target.value)}
            />

            <Input
              label="Votre fonction"
              placeholder="Directeur"
              value={champs.contact_fonction}
              onChange={(e) => poser('contact_fonction')(e.target.value)}
            />

            <Input
              label="Téléphone"
              required
              placeholder="06 61 07 27 77"
              value={champs.telephone}
              error={erreurs.telephone}
              inputMode="tel"
              autoComplete="tel"
              onChange={(e) => poser('telephone')(e.target.value)}
            />

            <Input
              label="Adresse e-mail"
              placeholder="direction@votre-ecole.ma"
              value={champs.email}
              type="email"
              inputMode="email"
              autoComplete="email"
              onChange={(e) => poser('email')(e.target.value)}
            />

            <Surtitre>Formule souhaitée</Surtitre>

            <Select
              label="Formule"
              value={champs.formule_visee}
              placeholder="À définir avec un conseiller"
              options={FORMULES.map((formule) => ({ value: formule, label: formule }))}
              onChange={(e) => poser('formule_visee')(e.target.value)}
            />

            <Textarea
              label="Votre message"
              rows={4}
              placeholder="Précisez ce qui vous ferait gagner du temps."
              value={champs.message}
              onChange={(e) => poser('message')(e.target.value)}
            />

            {/*
              RG09 — LE CONSENTEMENT N'EST PAS PRÉCOCHÉ, et il ne peut pas
              l'être : un consentement pré-donné n'en est pas un. Le serveur
              refuse la demande sans lui (422).
            */}
            <Checkbox
              checked={consentement}
              onChange={(e) => {
                setConsentement(e.target.checked);
                setErreurs(({ consentement: _ignore, ...reste }) => reste);
              }}
              label={
                <span style={{ fontSize: 13.5, lineHeight: 1.5, color: '#3A424E' }}>
                  J’autorise écoles360 à conserver ces informations pour me recontacter au sujet du
                  référencement de mon établissement (loi 09-08).
                </span>
              }
            />
            {erreurs.consentement && <Erreur>{erreurs.consentement}</Erreur>}

            {envoi.isError && <Erreur>{messageDErreur(envoi.error)}</Erreur>}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="outline" onClick={() => setEtape(0)} disabled={envoi.isPending}>
                Revenir
              </Button>
              <Button onClick={envoyer} disabled={envoi.isPending} style={{ flex: 1 }}>
                {envoi.isPending ? 'Envoi…' : 'Envoyer ma demande'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Le 429 est DIT EN FRANÇAIS, pas rendu comme une panne.
 *
 * Trois demandes par heure : un directeur qui s'y reprend à deux fois après
 * une faute de frappe ne doit pas croire que le site est cassé. Les autres
 * messages viennent du serveur et sont affichables tels quels — le front ne
 * les reformule pas.
 */
function messageDErreur(erreur: unknown): string {
  if (erreur instanceof ApiError) {
    if (erreur.statut === 429) {
      return 'Vous avez déjà envoyé plusieurs demandes. Réessayez dans une heure, ou appelez-nous directement.';
    }
    return erreur.message;
  }

  return 'La demande n’a pas pu être envoyée. Vérifiez votre connexion et réessayez.';
}

/** « Demande envoyée ! » — l'état de confirmation de la maquette. */
function Confirmation({ message, onRecommencer }: { message: string; onRecommencer: () => void }) {
  return (
    <section style={{ maxWidth: 680, margin: '72px auto 0', padding: '0 32px' }}>
      <div
        style={{
          background: '#fff',
          border: '1px solid #EAE6DE',
          borderRadius: 18,
          padding: '44px 32px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 62,
            height: 62,
            borderRadius: '50%',
            background: '#E6F4EC',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 18px',
          }}
        >
          <Icon name="check-circle" size={30} color="#2E9E5B" />
        </div>

        <h2 style={{ margin: 0, font: "800 26px/1.2 'Inter', sans-serif" }}>Demande envoyée !</h2>
        <p
          style={{
            font: "400 15px/1.6 'Inter', sans-serif",
            color: '#5A6472',
            margin: '12px auto 24px',
            maxWidth: 420,
          }}
        >
          {message}
        </p>

        <Button variant="outline" onClick={onRecommencer}>
          Envoyer une autre demande
        </Button>
      </div>
    </section>
  );
}

function Surtitre({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        font: "700 11.5px/1 'Inter', sans-serif",
        letterSpacing: '.7px',
        textTransform: 'uppercase',
        color: '#E63946',
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

function Erreur({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" style={{ font: "500 13px/1.5 'Inter', sans-serif", color: '#C42B38', margin: 0 }}>
      {children}
    </p>
  );
}
