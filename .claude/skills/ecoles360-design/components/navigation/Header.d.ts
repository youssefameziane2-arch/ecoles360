import * as React from 'react';

export interface NavItem {
  label: string;
  href?: string;
  active?: boolean;
}

/** écoles360 public site header — logo + horizontal nav + red CTA. Active link is red with a 2px underline. */
export interface HeaderProps {
  items?: NavItem[];
  /** Right-side CTA label. @default "Inscrire mon établissement" */
  cta?: string;
  onCta?: () => void;
  /** Optional image logo URL; falls back to the text wordmark. */
  logoSrc?: string;
  style?: React.CSSProperties;
}
export function Header(props: HeaderProps): JSX.Element;

/** écoles360 wordmark lockup — "écoles360" with red "360". */
export interface WordmarkProps {
  /** Font size in px. @default 22 */
  size?: number;
  /** White text for dark surfaces. @default false */
  onDark?: boolean;
  style?: React.CSSProperties;
}
export function Wordmark(props: WordmarkProps): JSX.Element;
