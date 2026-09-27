import * as React from 'react';

export interface FaqEntry {
  q: string;
  a: React.ReactNode;
}

/** écoles360 FAQ accordion — hairline rows, red chevron when open. */
export interface FaqAccordionProps {
  items: FaqEntry[];
  /** Index open initially, -1 for all closed. @default -1 */
  defaultOpen?: number;
  /** Allow multiple panels open at once. @default false */
  allowMultiple?: boolean;
  style?: React.CSSProperties;
}

export function FaqAccordion(props: FaqAccordionProps): JSX.Element;
