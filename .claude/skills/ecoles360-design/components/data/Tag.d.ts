import * as React from 'react';

/** écoles360 filière/subject chip on a neutral pill. Optional removable ✕ and active state. */
export interface TagProps {
  children?: React.ReactNode;
  /** Show a ✕ remove button. @default false */
  removable?: boolean;
  onRemove?: () => void;
  /** Navy-tinted active state. @default false */
  active?: boolean;
  style?: React.CSSProperties;
}

export function Tag(props: TagProps): JSX.Element;
