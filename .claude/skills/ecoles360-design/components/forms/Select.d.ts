import * as React from 'react';

type Option = string | { value: string; label: string };

/** écoles360 select — native <select> styled to match Input, with a chevron. Used for City (required), sort, filière. */
export interface SelectProps {
  label?: string;
  /** Show a red required asterisk. @default false */
  required?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Options as strings or {value,label} objects. */
  options?: Option[];
  /** Empty-state label. @default "Choisir…" */
  placeholder?: string;
  icon?: React.ReactNode;
  /** @default false */
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function Select(props: SelectProps): JSX.Element;
