import * as React from 'react';

/** écoles360 modal dialog over a navy scrim. Closes on backdrop click / Esc. */
export interface ModalProps {
  /** @default true */
  open?: boolean;
  title?: string;
  children?: React.ReactNode;
  /** Footer actions row (usually Buttons). */
  footer?: React.ReactNode;
  onClose?: () => void;
  /** Max width in px. @default 480 */
  width?: number;
  style?: React.CSSProperties;
}

export function Modal(props: ModalProps): JSX.Element | null;
