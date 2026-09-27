import * as React from 'react';

/**
 * écoles360 "establishment temporarily under update" screen. Renders as a
 * full-screen blurred overlay by default, or inline.
 *
 * @startingPoint section="Feedback" subtitle="Establishment profile unavailable (en mise à jour)" viewport="700x560"
 */
export interface ProfileUnavailableProps {
  /** @default "Cet établissement est temporairement en mise à jour" */
  title?: string;
  /** @default "La page de cet établissement est en cours de mise à jour sur notre plateforme." */
  message?: string;
  /** Reassurance line under the image; pass "" to hide. */
  note?: string;
  /** Image URL for the slot; null shows a building-icon placeholder; false hides the slot. */
  image?: string | null | false;
  /** @default "Rechercher un autre établissement" */
  searchLabel?: string;
  /** @default "Nous contacter" */
  contactLabel?: string;
  onSearch?: () => void;
  onContact?: () => void;
  /** Full-screen blurred overlay vs inline card. @default true */
  overlay?: boolean;
  style?: React.CSSProperties;
}

export function ProfileUnavailable(props: ProfileUnavailableProps): JSX.Element;
