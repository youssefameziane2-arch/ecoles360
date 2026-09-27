import * as React from 'react';

/** écoles360 credit-pack / subscription tier card. "Populaire" = navy fill + red ribbon. */
export interface PricingCardProps {
  name: string;
  /** Price, e.g. "499 MAD". */
  price: string;
  /** Unit suffix, e.g. "/mois". */
  unit?: string;
  /** Credit count shown in red. */
  credits?: number;
  features?: string[];
  /** Highlighted tier. @default false */
  popular?: boolean;
  /** Button label. @default "Choisir" */
  cta?: string;
  onSelect?: () => void;
  style?: React.CSSProperties;
}

export function PricingCard(props: PricingCardProps): JSX.Element;
