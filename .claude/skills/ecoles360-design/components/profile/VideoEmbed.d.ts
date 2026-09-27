import * as React from 'react';

/** écoles360 video embed — poster + red play button; swaps to an iframe on click. */
export interface VideoEmbedProps {
  /** Embed URL (YouTube/Vimeo). */
  src: string;
  /** Poster image URL. */
  poster?: string;
  /** @default "Vidéo de présentation" */
  title?: string;
  /** CSS aspect-ratio. @default "16 / 9" */
  ratio?: string;
  style?: React.CSSProperties;
}

export function VideoEmbed(props: VideoEmbedProps): JSX.Element;
