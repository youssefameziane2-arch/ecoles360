import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { chargerPageAPropos, paragraphes, type BlocsAPropos } from '@/api/pages';
import { Icon, TeamMember } from '@/ds/composants';
import { lienTelephone, lienWhatsApp } from '@/lib/telephone';
import { useTitrePage } from '@/lib/titre';

/** Icône de chaque valeur, par rang — celles de la maquette (`aboutIcons`). */
const ICONES_VALEURS = ['check-circle', 'eye', 'map-pin'];

/**
 * À propos — maquette `isAbout`, contenu servi par le CMS (`a-propos`).
 *
 * LE TEXTE N'EST PLUS DANS CE COMPOSANT. Il y était écrit en dur pendant
 * qu'une autre version dormait en base : deux vérités pour la même page, et
 * celle que le client pouvait modifier n'était pas celle qui s'affichait.
 *
 * CE QUI N'EST PAS DESSINÉ, FAUTE DE DONNÉE : la bande de chiffres de la
 * maquette (`trustStats`), l'image de « Notre histoire », la carte et les
 * réseaux sociaux de « Nous contacter ». Aucun n'a de source ; les dessiner
 * vides ou avec les valeurs de la maquette publierait des chiffres et des
 * comptes qui n'existent pas.
 */
export function APropos() {
  const page = useQuery({ queryKey: ['pages', 'a-propos'], queryFn: chargerPageAPropos });

  useTitrePage(
    'À propos',
    page.data?.blocs.mission ?? 'L’annuaire des établissements scolaires privés au Maroc.',
  );

  if (page.isPending) {
    return <div className="conteneur section">Chargement…</div>;
  }

  if (page.isError) {
    return (
      <div className="conteneur section">
        <p role="alert" style={{ ...texte, color: '#E63946' }}>
          La page n&rsquo;a pas pu être chargée. Rechargez-la dans un instant.
        </p>
      </div>
    );
  }

  const b = page.data.blocs;

  return (
    <div>
      <section style={{ maxWidth: 820, margin: '0 auto', padding: '64px 32px 0', textAlign: 'center' }}>
        <Surtitre>Notre mission</Surtitre>
        {b.accroche && (
          <h1 style={{ margin: 0, font: "800 42px/1.1 'Inter', sans-serif", letterSpacing: '-1.2px' }}>
            {b.accroche}
          </h1>
        )}
        {b.mission && (
          <p style={{ ...texte, margin: '18px auto 0', fontSize: 18, lineHeight: 1.6, color: '#5A6472', maxWidth: 600 }}>
            {b.mission}
          </p>
        )}
      </section>

      {paragraphes(b.histoire).length > 0 && (
        <Bande largeur={820}>
          <h2 style={titreSection}>Notre histoire</h2>
          {paragraphes(b.histoire).map((paragraphe) => (
            <p key={paragraphe} style={{ ...texte, margin: '0 0 16px' }}>
              {paragraphe}
            </p>
          ))}
        </Bande>
      )}

      {b.valeurs && b.valeurs.length > 0 && (
        <Bande>
          <EnTete surtitre="Ce qui nous guide" titre="Nos valeurs" />
          <div style={grille(260)}>
            {b.valeurs.map((valeur, rang) => (
              <div key={valeur.titre} style={{ ...carte, padding: 30, textAlign: 'center' }}>
                <div style={pastilleIcone(58)}>
                  <Icon name={ICONES_VALEURS[rang % ICONES_VALEURS.length] ?? 'check-circle'} size={26} color="#E63946" />
                </div>
                <h3 style={{ margin: '0 0 9px', font: "700 19px/1.3 'Inter', sans-serif", letterSpacing: '-0.3px' }}>
                  {valeur.titre}
                </h3>
                <p style={{ ...texte, fontSize: 14.5, lineHeight: 1.6, color: '#5A6472', margin: 0 }}>
                  {valeur.texte}
                </p>
              </div>
            ))}
          </div>
        </Bande>
      )}

      {/*
        ABSENTS DE LA MAQUETTE, PRÉSENTS SUR LE SITE : ces engagements étaient le
        texte de l'ancienne page, relu par le client. Ils disent ce qu'un
        annuaire payé par les établissements doit dire à un parent — ce qui est
        sponsorisé, comment les avis sont relus, ce que deviennent ses données
        (loi 09-08). Les retirer pour coller à la maquette les ferait
        disparaître du site.
      */}
      {b.engagements && b.engagements.length > 0 && (
        <Bande largeur={880}>
          <EnTete surtitre="Transparence" titre="Nos engagements" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {b.engagements.map((engagement) => (
              <section key={engagement.titre} style={{ ...carte, padding: '26px 28px' }}>
                <h3 style={{ margin: '0 0 12px', font: "700 19px/1.3 'Inter', sans-serif", color: '#1D3557' }}>
                  {engagement.titre}
                </h3>
                {paragraphes(engagement.texte).map((paragraphe) => (
                  <p key={paragraphe} style={{ ...texte, fontSize: 15, margin: '0 0 12px' }}>
                    {paragraphe}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </Bande>
      )}

      {/* Masquée tant qu'elle est vide : une section « Équipe » sans personne
          dirait qu'il n'y a personne. */}
      {b.equipe && b.equipe.length > 0 && (
        <Bande>
          <EnTete surtitre="Les visages" titre="L’équipe écoles360" />
          <div style={grille(220)}>
            {b.equipe.map((membre) => (
              <TeamMember key={`${membre.nom}-${membre.role}`} name={membre.nom} role={membre.role} />
            ))}
          </div>
        </Bande>
      )}

      {b.coordonnees && <Contact coordonnees={b.coordonnees} />}

      <section style={{ maxWidth: 1180, margin: '72px auto 90px', padding: '0 32px' }}>
        <div style={{ background: '#FBFAF7', border: '1px solid #EAE6DE', borderRadius: 20, padding: '52px 32px', textAlign: 'center' }}>
          <h2 style={{ ...titreSection, fontSize: 28, margin: 0 }}>Vous dirigez un établissement ?</h2>
          <p style={{ ...texte, margin: '12px auto 26px', fontSize: 16, color: '#5A6472', maxWidth: 480 }}>
            Rejoignez écoles360 et touchez les familles qui cherchent une école comme la vôtre.
          </p>
          <Link
            to="/inscription-etablissement"
            style={{
              display: 'inline-block',
              background: '#E63946',
              color: '#fff',
              font: "600 15px/1 'Inter', sans-serif",
              padding: '14px 28px',
              borderRadius: 11,
              boxShadow: '0 8px 18px rgba(230,57,70,.24)',
            }}
          >
            Inscrire mon établissement
          </Link>
        </div>
      </section>
    </div>
  );
}

/**
 * « Nous contacter » — le bloc contact de la maquette, depuis `coordonnees`.
 *
 * Une ligne sans valeur est omise, pas remplie : la maquette écrit
 * « Réponse sous 24 h » et des horaires, mais ce sont des promesses que seul
 * le back-office peut faire.
 */
function Contact({ coordonnees }: { coordonnees: BlocsAPropos['coordonnees'] }) {
  const cartes = [
    {
      icone: 'phone',
      libelle: 'Téléphone',
      valeur: coordonnees.telephone,
      lien: coordonnees.telephone ? lienTelephone(coordonnees.telephone) : undefined,
      detail: coordonnees.whatsapp ? `WhatsApp : ${coordonnees.whatsapp}` : undefined,
    },
    {
      icone: 'mail',
      libelle: 'E-mail',
      valeur: coordonnees.email,
      lien: coordonnees.email ? `mailto:${coordonnees.email}` : undefined,
      detail: undefined,
    },
    {
      icone: 'map-pin',
      libelle: 'Adresse',
      valeur: coordonnees.adresse,
      lien: undefined,
      detail: coordonnees.horaires,
    },
  ].filter((carteContact) => carteContact.valeur);

  return (
    <Bande>
      <EnTete surtitre="Parlons-en" titre="Nous contacter" />
      <div style={grille(240)}>
        {cartes.map((carteContact) => (
          <div key={carteContact.libelle} style={{ ...carte, padding: 26 }}>
            <div style={{ ...pastilleIcone(52), margin: '0 0 16px' }}>
              <Icon name={carteContact.icone} size={22} color="#E63946" />
            </div>
            <div style={libellePetit}>{carteContact.libelle}</div>
            {carteContact.lien ? (
              <a href={carteContact.lien} style={valeurContact}>
                {carteContact.valeur}
              </a>
            ) : (
              <div style={valeurContact}>{carteContact.valeur}</div>
            )}
            {carteContact.detail && (
              <div style={{ ...texte, fontSize: 13.5, color: '#5A6472', marginTop: 4 }}>{carteContact.detail}</div>
            )}
          </div>
        ))}
      </div>

      {coordonnees.whatsapp && (
        <div style={{ background: '#1D3557', borderRadius: 18, padding: 28, marginTop: 20 }}>
          <h3 style={{ margin: '0 0 6px', font: "700 18px/1.3 'Inter', sans-serif", color: '#fff' }}>
            Contact rapide sur WhatsApp
          </h3>
          <p style={{ ...texte, margin: '0 0 18px', fontSize: 14, color: '#AFC0D6' }}>
            Écrivez-nous au {coordonnees.whatsapp}.
          </p>
          <a
            href={lienWhatsApp(coordonnees.whatsapp)}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 9,
              background: '#2E9E5B',
              color: '#fff',
              font: "600 15px/1 'Inter', sans-serif",
              padding: 14,
              borderRadius: 11,
              maxWidth: 420,
            }}
          >
            <Icon name="message-circle" size={18} color="#fff" />
            Écrire sur WhatsApp
          </a>
        </div>
      )}
    </Bande>
  );
}

function Bande({ largeur = 1180, children }: { largeur?: number; children: React.ReactNode }) {
  return <section style={{ maxWidth: largeur, margin: '72px auto 0', padding: '0 32px' }}>{children}</section>;
}

function EnTete({ surtitre, titre }: { surtitre: string; titre: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 40 }}>
      <Surtitre>{surtitre}</Surtitre>
      <h2 style={{ ...titreSection, margin: 0 }}>{titre}</h2>
    </div>
  );
}

function Surtitre({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        font: "700 12px/1 'Inter', sans-serif",
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: '#E63946',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

/** Colonnes qui se replient seules : pas de point de rupture à tenir à jour. */
const grille = (minimum: number): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(${minimum}px, 1fr))`,
  gap: 22,
});

const pastilleIcone = (taille: number): React.CSSProperties => ({
  width: taille,
  height: taille,
  borderRadius: 15,
  background: '#FBE9EA',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 18px',
});

const carte: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #EAE6DE',
  borderRadius: 16,
};

const texte: React.CSSProperties = {
  font: "400 15.5px/1.75 'Inter', sans-serif",
  color: '#3A424E',
};

const titreSection: React.CSSProperties = {
  margin: '0 0 16px',
  font: "800 32px/1.2 'Inter', sans-serif",
  letterSpacing: '-0.8px',
};

const libellePetit: React.CSSProperties = {
  font: "700 12px/1 'Inter', sans-serif",
  letterSpacing: '.5px',
  textTransform: 'uppercase',
  color: '#9AA3AF',
  marginBottom: 6,
};

const valeurContact: React.CSSProperties = {
  display: 'block',
  font: "700 18px/1.3 'Inter', sans-serif",
  letterSpacing: '-0.3px',
  color: '#1A1A1A',
};
