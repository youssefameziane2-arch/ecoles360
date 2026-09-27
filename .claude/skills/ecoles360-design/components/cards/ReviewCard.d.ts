import * as React from 'react';

/** écoles360 review card — rating, body, optional establishment reply + moderation status. Flagged = red border. */
export interface ReviewCardProps {
  author: string;
  date: string;
  /** 1–5. @default 5 */
  rating?: number;
  body: string;
  /** Establishment reply text. */
  reply?: string;
  /** Moderation status. */
  status?: 'Publié' | 'En attente' | 'Signalé' | 'Rejeté';
  /** Red-tinted border for flagged content. @default false */
  flagged?: boolean;
  style?: React.CSSProperties;
}

export function ReviewCard(props: ReviewCardProps): JSX.Element;
