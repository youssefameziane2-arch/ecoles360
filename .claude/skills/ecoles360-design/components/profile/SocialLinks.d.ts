import * as React from 'react';

export interface SocialLink {
  /** Known channel; sets glyph + color. */
  type?: 'whatsapp' | 'phone' | 'website' | 'facebook' | 'instagram' | 'email';
  href?: string;
  /** Custom glyph (overrides type). */
  glyph?: React.ReactNode;
  label?: string;
}

/** écoles360 social/contact channel chips for a profile. */
export interface SocialLinksProps {
  links: SocialLink[];
  /** Chip size in px. @default 40 */
  size?: number;
  style?: React.CSSProperties;
}

export function SocialLinks(props: SocialLinksProps): JSX.Element;
