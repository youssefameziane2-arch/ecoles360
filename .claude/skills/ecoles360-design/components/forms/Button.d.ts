import * as React from 'react';

/**
 * écoles360 primary button. Red = primary CTA, navy = secondary action,
 * green = WhatsApp/success, outline/ghost = low-emphasis.
 *
 * @startingPoint section="Forms" subtitle="Buttons in all 5 variants" viewport="700x220"
 */
export interface ButtonProps {
  children?: React.ReactNode;
  /** Visual style. @default "primary" */
  variant?: 'primary' | 'navy' | 'success' | 'outline' | 'ghost';
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Full-width block button. @default false */
  block?: boolean;
  /** @default false */
  disabled?: boolean;
  /** Leading icon node (e.g. an <svg> or glyph). */
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

export function Button(props: ButtonProps): JSX.Element;
