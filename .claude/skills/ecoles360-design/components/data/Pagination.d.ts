import * as React from 'react';

/** écoles360 pagination — page numbers with prev/next, active page in red. */
export interface PaginationProps {
  /** Current 1-based page. @default 1 */
  page?: number;
  /** Total pages. @default 1 */
  pageCount?: number;
  onChange?: (page: number) => void;
  style?: React.CSSProperties;
}

export function Pagination(props: PaginationProps): JSX.Element;
