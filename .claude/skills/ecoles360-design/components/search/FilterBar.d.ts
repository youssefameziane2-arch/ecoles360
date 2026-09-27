import * as React from 'react';

export interface FilterChip {
  key: string;
  label: string;
  active?: boolean;
}

/** écoles360 results filter bar — chip row (type/filière/budget/note) + Appliquer/Réinitialiser. Active chips are navy. */
export interface FilterBarProps {
  filters: FilterChip[];
  onToggle?: (key: string) => void;
  onApply?: () => void;
  onReset?: () => void;
  /** @default "Appliquer" */
  applyLabel?: string;
  /** @default "Réinitialiser" */
  resetLabel?: string;
  style?: React.CSSProperties;
}

export function FilterBar(props: FilterBarProps): JSX.Element;
