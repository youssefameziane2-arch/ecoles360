import * as React from 'react';

/** écoles360 textarea — multiline, matches Input styling, vertically resizable. */
export interface TextareaProps {
  label?: string;
  /** Show a red required asterisk. @default false */
  required?: boolean;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  /** Visible rows. @default 4 */
  rows?: number;
  /** @default false */
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  style?: React.CSSProperties;
}

export function Textarea(props: TextareaProps): JSX.Element;
