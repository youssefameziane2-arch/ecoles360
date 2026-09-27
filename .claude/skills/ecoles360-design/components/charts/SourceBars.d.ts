import * as React from 'react';

export interface SourceDatum {
  label: string;
  value: number;
  tone?: 'green' | 'navy' | 'red' | 'amber';
}

/** écoles360 contact-source breakdown — horizontal labeled share bars. */
export interface SourceBarsProps {
  data: SourceDatum[];
  /** Show the % share next to each value. @default true */
  showShare?: boolean;
  style?: React.CSSProperties;
}

export function SourceBars(props: SourceBarsProps): JSX.Element;
