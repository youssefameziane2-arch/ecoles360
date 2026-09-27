import * as React from 'react';

/** écoles360 status badge — soft-tint pill for Sponsorisé, Vérifié, Nouveau, En cours, etc. */
export interface BadgeProps {
  children?: React.ReactNode;
  /** Semantic tone. @default "navy" */
  tone?: 'red' | 'navy' | 'green' | 'amber' | 'grey';
  /** Filled (solid color) instead of soft tint. @default false */
  solid?: boolean;
  /** Leading status dot. @default false */
  dot?: boolean;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Badge(props: BadgeProps): JSX.Element;
