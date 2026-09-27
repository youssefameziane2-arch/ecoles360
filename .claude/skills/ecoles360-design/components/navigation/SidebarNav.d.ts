import * as React from 'react';

export interface SidebarItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  /** Counter badge value. */
  count?: number;
}

/**
 * écoles360 dark back-office sidebar. Active item = solid red fill; counter
 * badges on the right; profile in the footer.
 */
export interface SidebarNavProps {
  /** Which space — sets the eyebrow label. @default "etablissement" */
  theme?: 'etablissement' | 'secretariat' | 'administration';
  items: SidebarItem[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  user?: { name: string; role: string };
  /** Optional image logo URL; falls back to the white wordmark. */
  logoSrc?: string;
  /** Sidebar width in px. @default 248 */
  width?: number;
  style?: React.CSSProperties;
}

export function SidebarNav(props: SidebarNavProps): JSX.Element;
