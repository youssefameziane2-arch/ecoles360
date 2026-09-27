import * as React from 'react';

/** écoles360 progress/gauge bar — flat track, colored fill. Credits gauge, completeness, rating rows. */
export interface ProgressBarProps {
  value?: number;
  /** @default 100 */
  max?: number;
  /** Fill color. @default "red" */
  tone?: 'red' | 'navy' | 'green' | 'amber';
  /** Track height in px. @default 8 */
  height?: number;
  label?: string;
  /** Show the percentage on the right. @default false */
  showValue?: boolean;
  style?: React.CSSProperties;
}

export function ProgressBar(props: ProgressBarProps): JSX.Element;
