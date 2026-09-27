import * as React from 'react';

/** écoles360 city tile — photo with navy scrim and establishment count overlay. */
export interface CityCardProps {
  city: string;
  count?: number;
  image?: string;
  /** Tile height in px. @default 150 */
  height?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function CityCard(props: CityCardProps): JSX.Element;
