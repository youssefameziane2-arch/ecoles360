import * as React from 'react';

/**
 * écoles360 establishment result/listing card. Sponsored = 4px red left border
 * + badge; verified = green check badge; ★ rating in amber.
 *
 * @startingPoint section="Cards" subtitle="Establishment result card, grid + row" viewport="700x420"
 */
export interface EstablishmentCardProps {
  name: string;
  city?: string;
  type?: string;
  /** Rating as a French-formatted string, e.g. "4,8". */
  rating?: string | number;
  reviews?: number;
  /** Photo URL. */
  image?: string;
  /** @default false */
  sponsored?: boolean;
  /** @default false */
  verified?: boolean;
  /** Price label, e.g. "à partir de 2 500 MAD". */
  price?: string;
  /** Filière tags. */
  tags?: string[];
  /** "grid" (image top) or "row" (image left). @default "grid" */
  layout?: 'grid' | 'row';
  onCall?: () => void;
  onWhatsApp?: () => void;
  onView?: () => void;
  style?: React.CSSProperties;
}

export function EstablishmentCard(props: EstablishmentCardProps): JSX.Element;
