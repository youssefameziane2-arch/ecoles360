import * as React from 'react';

export interface Step {
  label: string;
}

/** écoles360 multi-step progress for sign-up / onboarding flows. Done = red check, current = red. */
export interface StepperProps {
  steps: Step[];
  /** 0-based active step. @default 0 */
  current?: number;
  /** @default "horizontal" */
  orientation?: 'horizontal' | 'vertical';
  style?: React.CSSProperties;
}

export function Stepper(props: StepperProps): JSX.Element;
