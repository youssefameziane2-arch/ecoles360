import * as React from 'react';

/** Available icon names in the écoles360 set. */
export type IconName =
  | 'search' | 'map-pin' | 'phone' | 'message-circle' | 'star' | 'check'
  | 'check-circle' | 'x' | 'chevron-down' | 'chevron-right' | 'chevron-left'
  | 'eye' | 'credit-card' | 'mail' | 'calendar' | 'flag' | 'users'
  | 'graduation-cap' | 'building' | 'baby' | 'briefcase' | 'book-open'
  | 'settings' | 'bell' | 'plus' | 'home' | 'user' | 'heart' | 'layout-grid'
  | 'bar-chart' | 'info' | 'alert-triangle' | 'alert-circle' | 'inbox'
  | 'pencil' | 'trash' | 'globe' | 'external-link';

/**
 * écoles360 line icon (Lucide-style, 24×24, 2px stroke). The single icon source.
 *
 * @startingPoint section="Core" subtitle="Lucide-style icon set" viewport="700x180"
 */
export interface IconProps {
  name: IconName;
  /** Pixel size (width=height). @default 20 */
  size?: number;
  /** Stroke color; defaults to currentColor (inherits text color). */
  color?: string;
  /** @default 2 */
  strokeWidth?: number;
  /** Fill override; star/heart default to filled. */
  fill?: string;
  style?: React.CSSProperties;
}

export function Icon(props: IconProps): JSX.Element | null;

/** Map of icon name → inner SVG markup. */
export const ICONS: Record<string, string>;
