import * as React from 'react';

/** écoles360 loading placeholder with shimmer. */
export interface SkeletonProps {
  /** @default "rect" */
  variant?: 'text' | 'rect' | 'circle';
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: React.CSSProperties;
}

export function Skeleton(props: SkeletonProps): JSX.Element;

/** Pre-composed skeleton mirroring an EstablishmentCard. */
export function SkeletonCard(props: { style?: React.CSSProperties }): JSX.Element;
