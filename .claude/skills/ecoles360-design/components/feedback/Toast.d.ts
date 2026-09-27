import * as React from 'react';

/** écoles360 transient notification with tone icon + left accent bar. */
export interface ToastProps {
  /** @default "success" */
  tone?: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message?: string;
  onClose?: () => void;
  style?: React.CSSProperties;
}

export function Toast(props: ToastProps): JSX.Element;
