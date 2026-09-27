import * as React from 'react';
import type { IconName } from '../core/Icon';

/** écoles360 empty-state placeholder — icon, title, description, optional CTA. */
export interface EmptyStateProps {
  /** Icon name. @default "inbox" */
  icon?: IconName;
  title: string;
  description?: string;
  /** CTA node (usually a Button). */
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export function EmptyState(props: EmptyStateProps): JSX.Element;
