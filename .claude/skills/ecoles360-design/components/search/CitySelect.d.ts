import * as React from 'react';

/** écoles360 required city picker — pin icon, red required marker, Morocco city list. */
export interface CitySelectProps {
  /** @default "Ville" */
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Override the default city list. */
  cities?: string[];
  /** @default "Choisir une ville" */
  placeholder?: string;
  /** @default true */
  required?: boolean;
  style?: React.CSSProperties;
}

export function CitySelect(props: CitySelectProps): JSX.Element;
