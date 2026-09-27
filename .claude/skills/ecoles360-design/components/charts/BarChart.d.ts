import * as React from 'react';

export interface BarDatum {
  label: string;
  value: number;
}

/** écoles360 monthly bar chart — flat bars, current bar in red. CSS only. */
export interface BarChartProps {
  data: BarDatum[];
  /** Index of the highlighted (red) bar. -1 = last. @default -1 */
  currentIndex?: number;
  /** Chart height in px. @default 180 */
  height?: number;
  /** Format the value label. */
  valueFormat?: (value: number) => React.ReactNode;
  style?: React.CSSProperties;
}

export function BarChart(props: BarChartProps): JSX.Element;
