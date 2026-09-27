import * as React from 'react';

/** écoles360 inbound contact-request card for the inbox. Status: Nouveau/En cours/Traité. */
export interface RequestCardProps {
  name: string;
  /** Contact channel. @default "Formulaire" */
  channel?: 'WhatsApp' | 'Appel' | 'Formulaire' | 'Email';
  message: string;
  /** Relative time, e.g. "il y a 2 h". */
  time: string;
  /** @default "Nouveau" */
  status?: 'Nouveau' | 'En cours' | 'Traité';
  onOpen?: () => void;
  style?: React.CSSProperties;
}

export function RequestCard(props: RequestCardProps): JSX.Element;
