import * as React from 'react';

/** écoles360 staff card for the Équipe tab — avatar, name, role. */
export interface TeamMemberProps {
  name: string;
  role: string;
  /** Photo URL; falls back to a monogram. */
  photo?: string;
  style?: React.CSSProperties;
}

export function TeamMember(props: TeamMemberProps): JSX.Element;
