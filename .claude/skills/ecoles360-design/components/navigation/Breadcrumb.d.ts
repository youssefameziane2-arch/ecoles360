import * as React from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** écoles360 breadcrumb trail — chevron separators, bold current page. */
export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  style?: React.CSSProperties;
}

export function Breadcrumb(props: BreadcrumbProps): JSX.Element;
