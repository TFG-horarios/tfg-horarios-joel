import { useTranslations } from 'next-intl';
import { Fragment, type ReactNode, type RefObject } from 'react';
import type { ScheduleTimelineRow } from '@tfg-horarios/shared';

export type WeeklyScheduleGridProps = {
  gridRef?: RefObject<HTMLDivElement | null>;
  daysOfWeek: { value: number; label: string }[];
  numSlots: number;
  rows?: ScheduleTimelineRow[];
  startSlotIndex?: number;
  slotTimeLabels: Record<number, string>;
  renderCell: (day: number, slotIndex: number) => ReactNode;
};

export function WeeklyScheduleGrid({
  gridRef,
  daysOfWeek,
  numSlots,
  rows,
  startSlotIndex = 0,
  slotTimeLabels,
  renderCell,
}: WeeklyScheduleGridProps) {
  const t = useTranslations('Organizations.schedules.planner');
  const timelineRows =
    rows ??
    Array.from({ length: numSlots }).map((_, i) => ({
      type: 'slot' as const,
      slotIndex: startSlotIndex + i,
      slotNumber: startSlotIndex + i + 1,
      startMinutes: 0,
      endMinutes: 0,
      startTime: '',
      endTime: '',
      label: slotTimeLabels[startSlotIndex + i] ?? '',
    }));

  return (
    <div className="flex min-h-125 w-full max-w-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card/30 shadow-inner backdrop-blur-sm">
      <div className="flex min-w-0 items-center justify-between border-b border-border bg-muted/30 p-3 sm:p-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          {t('weeklyView')}
        </h2>
      </div>

      <div
        className="w-full min-w-0 max-w-full flex-1 overflow-x-auto overscroll-x-contain bg-background"
        ref={gridRef}
      >
        <div className="w-full min-w-[40rem] space-y-1.5 p-1.5 sm:min-w-[46rem] sm:space-y-4 sm:p-6">
          <div className="grid grid-cols-[3.5rem_repeat(5,minmax(6rem,1fr))] gap-1 sm:grid-cols-[minmax(5.75rem,0.7fr)_repeat(5,minmax(7.5rem,1fr))] sm:gap-3">
            <div className="flex items-center justify-center rounded-lg p-1 sm:p-3"></div>
            {daysOfWeek.map((day) => (
              <div
                key={day.value}
                className="flex min-w-0 flex-col items-center justify-center rounded-lg border border-border/50 bg-muted/40 p-1 shadow-sm sm:p-3"
              >
                <span className="max-w-full truncate text-[10px] font-semibold uppercase tracking-wider text-foreground sm:text-xs">
                  {day.label}
                </span>
              </div>
            ))}
          </div>

          {timelineRows.map((row) => {
            if (row.type === 'break') {
              return (
                <div
                  key={`break_${row.boundaryIndex}`}
                  className="grid min-h-11 grid-cols-[3.5rem_repeat(5,minmax(6rem,1fr))] gap-1 sm:min-h-16 sm:grid-cols-[minmax(5.75rem,0.7fr)_repeat(5,minmax(7.5rem,1fr))] sm:gap-3"
                >
                  <div className="flex min-w-0 flex-col items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 p-0.5 text-center sm:p-3">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300 sm:text-[10px]">
                      {t('break')}
                    </span>
                    <span className="font-mono text-[10px] font-semibold text-foreground sm:text-xs">
                      {row.label}
                    </span>
                  </div>
                  <div className="col-span-5 flex min-w-0 items-center justify-center rounded-lg border border-dashed border-amber-500/30 bg-amber-500/10 px-2 text-center text-[10px] font-medium text-amber-800 dark:text-amber-200 sm:text-sm">
                    {t('breakRow', { time: row.label })}
                  </div>
                </div>
              );
            }

            const idx = row.slotIndex;
            return (
              <div
                key={idx}
                className="grid min-h-17 grid-cols-[3.5rem_repeat(5,minmax(6rem,1fr))] gap-1 sm:min-h-22.5 sm:grid-cols-[minmax(5.75rem,0.7fr)_repeat(5,minmax(7.5rem,1fr))] sm:gap-3"
              >
                <div className="flex min-w-0 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-0.5 text-center sm:p-3">
                  <span className="text-[7px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[10px] sm:tracking-widest">
                    {t('block', { index: row.slotNumber })}
                  </span>
                  <span className="font-mono text-[10px] font-semibold text-foreground sm:text-xs">
                    {slotTimeLabels[idx]}
                  </span>
                </div>

                {daysOfWeek.map((day) => (
                  <Fragment key={`${day.value}_${idx}`}>
                    {renderCell(day.value, idx)}
                  </Fragment>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
