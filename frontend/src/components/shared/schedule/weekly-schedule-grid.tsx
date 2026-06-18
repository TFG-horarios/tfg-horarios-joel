import React from 'react';
import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type WeeklyScheduleGridProps = {
  gridRef?: React.RefObject<HTMLDivElement | null>;
  daysOfWeek: { value: number; label: string }[];
  numSlots: number;
  startSlotIndex?: number;
  slotTimeLabels: Record<number, string>;
  renderCell: (day: number, slotIndex: number) => React.ReactNode;
};

export function WeeklyScheduleGrid({
  gridRef,
  daysOfWeek,
  numSlots,
  startSlotIndex = 0,
  slotTimeLabels,
  renderCell,
}: WeeklyScheduleGridProps) {
  const t = useTranslations('Organizations.schedules.planner');

  return (
    <div className="flex flex-col min-h-125 bg-card/30 backdrop-blur-sm border border-border rounded-xl shadow-inner overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Clock className="size-4 text-indigo-500" />
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

          {Array.from({ length: numSlots }).map((_, i) => {
            const idx = startSlotIndex + i;
            return (
              <div key={idx} className="grid grid-cols-6 gap-3 min-h-22.5">
                <div className="flex flex-col items-center justify-center p-3 bg-muted/20 border border-dashed border-border rounded-lg text-center">
                  <span className="text-xs font-semibold text-foreground font-mono">
                    {slotTimeLabels[idx]}
                  </span>
                </div>

                {daysOfWeek.map((day) => (
                  <React.Fragment key={`${day.value}_${idx}`}>
                    {renderCell(day.value, idx)}
                  </React.Fragment>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
