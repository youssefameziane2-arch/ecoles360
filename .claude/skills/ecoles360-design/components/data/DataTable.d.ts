import * as React from 'react';

export interface Column<Row = any> {
  key: string;
  header: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  /** Custom cell renderer; receives the row. */
  render?: (row: Row) => React.ReactNode;
}

/** écoles360 data table — uppercase hairline headers; collapses to stacked cards below `stackAt`px. */
export interface DataTableProps<Row = any> {
  columns: Column<Row>[];
  rows: Row[];
  /** Viewport width (px) below which the table stacks into cards. @default 720 */
  stackAt?: number;
  /** Field used as React key. @default "id" */
  rowKey?: string;
  style?: React.CSSProperties;
}

export function DataTable(props: DataTableProps): JSX.Element;
