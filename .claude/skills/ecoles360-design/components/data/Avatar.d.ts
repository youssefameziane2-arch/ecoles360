import * as React from 'react';

/** écoles360 avatar — monogram in a deterministic brand color, or a photo. */
export interface AvatarProps {
  /** Person/establishment name; drives initials and color. */
  name?: string;
  /** Optional photo URL; replaces the monogram. */
  src?: string;
  /** Diameter in px. @default 40 */
  size?: number;
  style?: React.CSSProperties;
}

export function Avatar(props: AvatarProps): JSX.Element;
