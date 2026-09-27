import * as React from 'react';

/** écoles360 dashboard KPI card — big numeral, label, delta, icon chip. */
export interface StatCardProps {
  label: string;
  value: string | number;
  /** Delta label, e.g. "12%". */
  delta?: string;
  /** Delta direction. @default "up" */
  deltaDir?: 'up' | 'down';
  icon?: React.ReactNode;
  /** Icon-chip tone. @default "navy" */
  tone?: 'navy' | 'red' | 'green' | 'amber';
  style?: React.CSSProperties;
}

export function StatCard(props: StatCardProps): JSX.Element;
