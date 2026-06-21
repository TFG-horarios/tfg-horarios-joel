'use client';

import type { Shift } from '@tfg-horarios/shared';
import { memo } from 'react';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { Clock, Sun, Moon } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface ClassroomScheduleDTO {
  classroomId: string;
  academicYearId: string;
  shift: Shift;
  period: number;
}

export interface ClassroomScheduleCardProps {
  item: ClassroomScheduleDTO;
  classroomMap: Record<string, string>;
  organizationId: string;
  academicYearId: string;
  translations?: Record<string, string>;
}

export const ClassroomScheduleCard = memo(function ClassroomScheduleCard({
  item: config,
  classroomMap,
  organizationId,
  academicYearId,
  translations = {},
}: ClassroomScheduleCardProps) {
  const t = useTranslations('Organizations.classroomSchedules.card');
  const classroomName =
    classroomMap[config.classroomId] || t('unknownClassroom');

  const shiftLabel = translations[`shift_${config.shift}`] || config.shift;
  const scheduleUrl = `/organizations/${organizationId}/academic-years/${academicYearId}/classroom-schedules/${config.classroomId}?shift=${config.shift}&period=${config.period}`;

  return (
    <InteractiveCard className="h-full" href={scheduleUrl}>
      <div className="flex flex-col h-full w-full">
        <div className="flex flex-col flex-1 justify-center">
          <h3
            className="text-xl font-semibold transition-colors line-clamp-3"
            title={classroomName}
          >
            {classroomName}
          </h3>
        </div>

        <div className="mt-auto pt-4 flex flex-wrap gap-2 justify-center pr-12">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80"
            title={translations.period || 'Period'}
          >
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">
              {t('semester', { period: config.period })}
            </span>
          </div>
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80"
            title={translations.shift || 'Shift'}
          >
            {config.shift === 'morning' ? (
              <Sun className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="truncate capitalize">{shiftLabel}</span>
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
});
