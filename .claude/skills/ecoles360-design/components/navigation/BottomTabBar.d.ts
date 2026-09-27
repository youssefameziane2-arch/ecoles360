import * as React from 'react';

export interface TabBarItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

/** écoles360 mobile bottom tab bar. Active tab in red, ≥44px touch targets. */
export interface BottomTabBarProps {
  items: TabBarItem[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  style?: React.CSSProperties;
}

export function BottomTabBar(props: BottomTabBarProps): JSX.Element;
