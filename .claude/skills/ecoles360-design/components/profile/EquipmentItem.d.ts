import * as React from 'react';

/** écoles360 facility item for the Équipements grid — icon chip + label. */
export interface EquipmentItemProps {
  icon?: React.ReactNode;
  label: string;
  /** Dim + "Non dispo." when false. @default true */
  available?: boolean;
  style?: React.CSSProperties;
}

export function EquipmentItem(props: EquipmentItemProps): JSX.Element;
