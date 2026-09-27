import * as React from 'react';

/** écoles360 text input — label above, hairline border, optional leading icon, red error state. */
export interface InputProps {
  /** Field label rendered above the control. */
  label?: string;
  /** Show a red required asterisk. @default false */
  required?: boolean;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  /** HTML input type. @default "text" */
  type?: string;
  /** Leading icon node. */
  icon?: React.ReactNode;
  /** Error message; non-empty turns the border red and shows the text below. */
  error?: string;
  /** @default false */
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
}

export function Input(props: InputProps): JSX.Element;
