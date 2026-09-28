import { useQuery } from '@tanstack/react-query';
import { chargerPageLegale, paragraphes, type CleLegale } from '@/api/pages';
import { useTitrePage } from '@/lib/titre';
import { formaterDate } from '@/lib/formats';

/**
 * Mentions légales, confidentialité, cookies — un seul composant pour les trois.
 *
 * CES PAGES N'ONT PAS DE GABARIT, seulement des titres et de la prose. Trois
 * composants auraient recopié la même mise en page en triple, et la première
 * correction du juriste aurait demandé trois modifications.
 *
 * LE TEXTE VIT EN BASE. La loi 09-08 (RG09) exige ces pages d'un service qui
 * recueille les coordonnées de parents ; leur contenu engage l'éditeur du
 * site, qui doit pouvoir le corriger sans attendre une livraison. C'est
 * l'écran « Contenu du site » qui les rédige.
 */
export function PageLegale({ cle, description }: { cle: CleLegale; description: string }) {
  const page = useQuery({ queryKey: ['pages', cle], queryFn: () => chargerPageLegale(cle) });

  useTitrePage(page.data?.titre ?? 'Informations légales', description);

  const sections = page.data?.blocs.sections ?? [];

  return (
    <div style={{ background: '#FAF8F5', minHeight: '60vh' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '56px 32px 72px' }}>
        <h1 style={{ font: "800 34px/1.2 'Inter', sans-serif", color: '#1A1A1A', margin: 0 }}>
          {page.data?.titre ?? '…'}
        </h1>

        {/*
          LA DATE DE MISE À JOUR N'EST PAS DÉCORATIVE. Une politique de
          confidentialité se lit à une date : c'est elle qui dit quelle version
          s'appliquait le jour où un visiteur a laissé ses coordonnées.
        */}
        {page.data?.modifiee_le && (
          <p
            style={{
              font: "400 13px/1.5 'Inter', sans-serif",
              color: '#9AA3AF',
              margin: '8px 0 0',
            }}
          >
            Dernière mise à jour le {formaterDate(page.data.modifiee_le)}
          </p>
        )}

        {page.isPending && <p style={{ ...texteCourant, marginTop: 32 }}>Chargement…</p>}

        {page.isError && (
          <p style={{ ...texteCourant, marginTop: 32 }}>
            Cette page n’a pas pu être chargée. Écrivez-nous à{' '}
            <a href="mailto:contact@ecoles360.com" style={{ color: '#C42B38' }}>
              contact@ecoles360.com
            </a>
            .
          </p>
        )}

        {sections.map((section) => (
          <section key={section.titre} style={{ marginTop: 34 }}>
            <h2
              style={{
                font: "700 19px/1.3 'Inter', sans-serif",
                color: '#1A1A1A',
                margin: '0 0 10px',
              }}
            >
              {section.titre}
            </h2>

            {paragraphes(section.corps).map((paragraphe, rang) => (
              <p key={rang} style={texteCourant}>
                {paragraphe}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

const texteCourant: React.CSSProperties = {
  font: "400 15px/1.75 'Inter', sans-serif",
  color: '#3D4756',
  margin: '0 0 12px',
};
