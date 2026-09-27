import * as React from 'react';

/** écoles360 checkbox — red fill when checked, hairline square when not. Controlled or uncontrolled. */
export interface CheckboxProps {
  label?: string;
  /** Controlled checked state. */
  checked?: boolean;
  /** Uncontrolled initial state. */
  defaultChecked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** @default false */
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function Checkbox(props: CheckboxProps): JSX.Element;
