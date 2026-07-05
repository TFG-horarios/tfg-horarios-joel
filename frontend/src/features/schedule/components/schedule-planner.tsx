'use client';

import dynamic from 'next/dynamic';
import type { SchedulePlannerProps } from './schedule-planner-editor';

const SchedulePlannerEditor = dynamic(() =>
  import('./schedule-planner-editor').then((mod) => mod.SchedulePlannerEditor)
);

const SchedulePlannerReadOnly = dynamic(() =>
  import('./schedule-planner-read-only').then(
    (mod) => mod.SchedulePlannerReadOnly
  )
);

export function SchedulePlanner(props: SchedulePlannerProps) {
  if (props.canUpdate) {
    return <SchedulePlannerEditor {...props} />;
  }

  return <SchedulePlannerReadOnly {...props} />;
}
