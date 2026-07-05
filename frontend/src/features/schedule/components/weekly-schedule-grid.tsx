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
    <div className="flex flex-col min-h-125 bg-card/30 backdrop-blur-sm border border-border rounded-xl shadow-inner overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          {t('weeklyView')}
        </h2>
      </div>

      <div className="flex-1 w-full overflow-x-hidden">
        <div className="w-full p-6 space-y-4 bg-background" ref={gridRef}>
          <div className="grid grid-cols-6 gap-3">
            <div className="flex items-center justify-center p-3 rounded-lg"></div>
            {daysOfWeek.map((day) => (
              <div
                key={day.value}
                className="flex flex-col items-center justify-center p-3 bg-muted/40 rounded-lg border border-border/50 shadow-sm"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
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
                  className="grid grid-cols-6 gap-3 min-h-16"
                >
                  <div className="flex flex-col items-center justify-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
                      {t('break')}
                    </span>
                    <span className="text-xs font-semibold text-foreground font-mono">
                      {row.label}
                    </span>
                  </div>
                  <div className="col-span-5 flex items-center justify-center rounded-lg border border-dashed border-amber-500/30 bg-amber-500/10 text-sm font-medium text-amber-800 dark:text-amber-200">
                    {t('breakRow', { time: row.label })}
                  </div>
                </div>
              );
            }

            const idx = row.slotIndex;
            return (
              <div key={idx} className="grid grid-cols-6 gap-3 min-h-22.5">
                <div className="flex flex-col items-center justify-center p-3 bg-muted/20 border border-dashed border-border rounded-lg text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t('block', { index: row.slotNumber })}
                  </span>
                  <span className="text-xs font-semibold text-foreground font-mono">
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
