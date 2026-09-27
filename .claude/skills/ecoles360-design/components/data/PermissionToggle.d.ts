import * as React from 'react';

/** écoles360 labeled switch row — secrétaire permissions, admin settings. Red when on. */
export interface PermissionToggleProps {
  label?: string;
  description?: string;
  /** Controlled state. */
  checked?: boolean;
  /** Uncontrolled initial state. @default false */
  defaultChecked?: boolean;
  onChange?: (next: boolean) => void;
  /** @default false */
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function PermissionToggle(props: PermissionToggleProps): JSX.Element;
