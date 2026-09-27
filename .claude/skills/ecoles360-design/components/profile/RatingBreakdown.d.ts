import * as React from 'react';

/** écoles360 rating distribution — average + 5★→1★ amber bars. */
export interface RatingBreakdownProps {
  /** Average as a French string, e.g. "4,8". */
  average: string | number;
  /** Total reviews; defaults to the sum of `distribution`. */
  total?: number;
  /** Counts from 5★ down to 1★: [c5, c4, c3, c2, c1]. */
  distribution?: number[];
  style?: React.CSSProperties;
}

export function RatingBreakdown(props: RatingBreakdownProps): JSX.Element;
