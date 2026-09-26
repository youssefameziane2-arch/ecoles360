import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { chargerFaq } from '@/api/faq';
import { AccordeonFaq } from '@/components/AccordeonFaq';
import { useTitrePage } from '@/lib/titre';

/**
 * Questions fréquentes — écran `isFaq` de la maquette (« Centre d'aide »).
 *
 * LE CONTENU VIENT DE L'API, PAS DU CODE. La maquette montre une FAQ que
 * l'administrateur pilote depuis le back-office : elle engage le produit
 * (« c'est gratuit pour les parents », « votre fiche est publiée sous 48 h »)
 * et doit pouvoir être corrigée en cinq minutes, sans déploiement.
 */
export function Faq() {
  const faq = useQuery({ queryKey: ['faq'], queryFn: chargerFaq });

  useTitrePage(
    'Questions fréquentes',
    'Tout ce qu’il faut savoir sur écoles360, pour les parents comme pour les établissements.',
  );

  return (
    <div>
      <section style={{ maxWidth: 880, margin: '0 auto', padding: '56px 32px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            font: "400 13px/1 'Inter', sans-serif",
            color: '#9AA3AF',
            marginBottom: 18,
          }}
        >
          <Link to="/" style={{ color: '#9AA3AF' }}>
            Accueil
          </Link>
          <span>›</span>
          <span style={{ color: '#5A6472' }}>FAQ</span>
        </div>

        <div
          style={{
            font: "700 12px/1 'Inter', sans-serif",
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: '#E63946',
            marginBottom: 10,
          }}
        >
          Centre d&rsquo;aide
        </div>
        <h1 style={{ margin: 0, font: "800 38px/1.15 'Inter', sans-serif", letterSpacing: '-1px' }}>
          Questions fréquentes
        </h1>
        <p
          style={{
            margin: '14px 0 0',
            font: "400 16px/1.6 'Inter', sans-serif",
            color: '#5A6472',
            maxWidth: 600,
          }}
        >
          Tout ce qu&rsquo;il faut savoir sur écoles360, pour les parents comme pour les
          établissements.
        </p>
      </section>

      <section style={{ maxWidth: 880, margin: '28px auto 0', padding: '0 32px 40px' }}>
        {faq.isPending && <SqueletteRubriques />}

        {faq.isError && (
          <p style={{ font: "400 15px/1.6 'Inter', sans-serif", color: '#5A6472' }}>
            Les questions fréquentes n&rsquo;ont pas pu être chargées. Rechargez la page dans un
            instant.
          </p>
        )}

        {faq.data?.length === 0 && (
          <p style={{ font: "400 15px/1.6 'Inter', sans-serif", color: '#5A6472' }}>
            Aucune question n&rsquo;est publiée pour le moment.
          </p>
        )}

        {faq.data?.map((rubrique) => (
          <div key={rubrique.groupe} style={{ marginBottom: 34 }}>
            <h2
              style={{
                margin: '0 0 14px',
                font: "800 18px/1.3 'Inter', sans-serif",
                letterSpacing: '-0.3px',
                color: '#1D3557',
              }}
            >
              {rubrique.groupe}
            </h2>
            <AccordeonFaq items={rubrique.items} />
          </div>
        ))}

        <div
          style={{
            background: '#FBFAF7',
            border: '1px solid #EAE6DE',
            borderRadius: 16,
            padding: '26px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ font: "800 17px/1.3 'Inter', sans-serif", letterSpacing: '-0.3px' }}>
              Vous ne trouvez pas votre réponse ?
            </div>
            <p
              style={{
                margin: '6px 0 0',
                font: "400 14px/1.5 'Inter', sans-serif",
                color: '#5A6472',
              }}
            >
              Notre équipe vous répond gratuitement, du lundi au samedi.
            </p>
          </div>
          {/*
            LA MAQUETTE N'A PAS D'ÉCRAN DE CONTACT. Son bouton appelle un
            `goContact` qui n'est déclaré nulle part : le prototype prévoit la
            destination sans la dessiner. Plutôt que d'inventer une page ou de
            laisser un bouton mort, il ouvre le courriel de l'équipe — c'est ce
            que la carte promet, et ça marche aujourd'hui.
          */}
          <a
            href="mailto:contact@ecoles360.com"
            style={{
              border: 'none',
              background: '#E63946',
              color: '#fff',
              font: "600 14.5px/1 'Inter', sans-serif",
              padding: '13px 24px',
              borderRadius: 11,
              flex: 'none',
            }}
          >
            Nous contacter
          </a>
        </div>
      </section>
    </div>
  );
}

/**
 * Attente — des lignes grises à la place des questions.
 *
 * La FAQ arrive en une seule requête, sans pagination : sans ce gabarit, la
 * page s'afficherait avec son titre puis sauterait de 600 px d'un coup.
 */
function SqueletteRubriques() {
  return (
    <div style={{ marginBottom: 34 }} aria-hidden>
      <div
        style={{ width: 180, height: 18, borderRadius: 6, background: '#EFEBE3', marginBottom: 16 }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0, 1, 2, 3].map((rang) => (
          <div
            key={rang}
            style={{
              height: 58,
              borderRadius: 12,
              border: '1px solid #EAE6DE',
              background: '#fff',
            }}
          />
        ))}
      </div>
    </div>
  );
}
