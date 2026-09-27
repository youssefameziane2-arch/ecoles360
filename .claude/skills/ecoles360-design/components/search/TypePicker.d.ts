import * as React from 'react';

export interface EstablishmentType {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

/**
 * écoles360 establishment-type picker — 6 cards (Crèche → Formation).
 * Selected card gets a navy border + tint.
 *
 * @startingPoint section="Search" subtitle="6 type cards with selected state" viewport="700x120"
 */
export interface TypePickerProps {
  /** Override the default 6 types (e.g. to swap emoji for Lucide icons). */
  types?: EstablishmentType[];
  /** Selected keys (array even in single mode). */
  value?: string[];
  /** Allow multiple selection. @default false */
  multi?: boolean;
  onChange?: (keys: string[]) => void;
  /** Grid columns. @default 6 */
  columns?: number;
  style?: React.CSSProperties;
}

export function TypePicker(props: TypePickerProps): JSX.Element;
