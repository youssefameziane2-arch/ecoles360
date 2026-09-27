import * as React from 'react';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

/** écoles360 profile section tabs (À propos / Filières / Équipements / Tarifs / Équipe / Avis). Active = red underline. */
export interface TabsProps {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (key: string) => void;
  style?: React.CSSProperties;
}

export function Tabs(props: TabsProps): JSX.Element;
