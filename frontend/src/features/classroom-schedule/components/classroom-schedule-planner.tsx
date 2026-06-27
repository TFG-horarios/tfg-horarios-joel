'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Loader2 } from 'lucide-react';
import { useScheduleExport } from '@/hooks/schedule/use-schedule-export';
import {
  ClassroomTimelineWeek,
  type ClassroomTimelineEvent,
} from '@/components/shared/schedule/classroom-timeline-week';
import type {
  Shift,
  ClassroomDTO,
  SubjectDTO,
  SubjectGroupDTO,
  DegreeDTO,
  AcademicYearDTO,
  ClassroomOccupancyEventDTO,
} from '@tfg-horarios/shared';
import { formatMinutesAsTime, parseTimeToMinutes } from '@tfg-horarios/shared';

type ClassroomSchedulePlannerProps = {
  events: ClassroomOccupancyEventDTO[];
  classroom: ClassroomDTO;
  subjects: SubjectDTO[];
  subjectGroups: SubjectGroupDTO[];
  degrees: DegreeDTO[];
  academicYear: AcademicYearDTO;
  shift: Shift;
  period: number;
};

type PlannerEvent = ClassroomTimelineEvent & ClassroomOccupancyEventDTO;

const subjectPalette = [
  'border-sky-300 bg-sky-50/95 text-sky-950 dark:border-sky-800/70 dark:bg-sky-950/50 dark:text-sky-100',
  'border-violet-300 bg-violet-50/95 text-violet-950 dark:border-violet-800/70 dark:bg-violet-950/50 dark:text-violet-100',
  'border-emerald-300 bg-emerald-50/95 text-emerald-950 dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-100',
  'border-amber-300 bg-amber-50/95 text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-100',
  'border-rose-300 bg-rose-50/95 text-rose-950 dark:border-rose-800/70 dark:bg-rose-950/50 dark:text-rose-100',
  'border-cyan-300 bg-cyan-50/95 text-cyan-950 dark:border-cyan-800/70 dark:bg-cyan-950/50 dark:text-cyan-100',
  'border-fuchsia-300 bg-fuchsia-50/95 text-fuchsia-950 dark:border-fuchsia-800/70 dark:bg-fuchsia-950/50 dark:text-fuchsia-100',
  'border-lime-300 bg-lime-50/95 text-lime-950 dark:border-lime-800/70 dark:bg-lime-950/50 dark:text-lime-100',
];

const hashString = (value: string) =>
  value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

export function ClassroomSchedulePlanner({
  events,
  classroom,
  subjects,
  subjectGroups,
  degrees,
  academicYear,
  shift,
  period,
}: ClassroomSchedulePlannerProps) {
  const t = useTranslations('Organizations.classroomSchedules.planner');
  const { isExportingPDF, gridRef, exportPDF } = useScheduleExport();

  const daysOfWeek = [
    { value: 1, label: t('days.1') },
    { value: 2, label: t('days.2') },
    { value: 3, label: t('days.3') },
    { value: 4, label: t('days.4') },
    { value: 5, label: t('days.5') },
  ];

  const slotMetaMap = useMemo(() => {
    const map = new Map<
      string,
      {
        group: SubjectGroupDTO | undefined;
        subject: SubjectDTO | undefined;
        degree: DegreeDTO | undefined;
      }
    >();
    subjectGroups.forEach((group) => {
      const subject = subjects.find((sub) => sub.id === group.subjectId);
      const degree = subject
        ? degrees.find((d) => d.id === subject.degreeId)
        : undefined;
      map.set(group.id, { group, subject, degree });
    });
    return map;
  }, [subjectGroups, subjects, degrees]);

  const timelineEvents: PlannerEvent[] = useMemo(
    () =>
      events
        .filter((event) => event.dayOfWeek >= 1 && event.dayOfWeek <= 5)
        .map((event) => ({
          ...event,
          day: event.dayOfWeek,
        })),
    [events]
  );

  const startTimeMinutes = parseTimeToMinutes(academicYear.centerOpeningTime);
  const endTimeMinutes = parseTimeToMinutes(academicYear.centerClosingTime);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-card/40 backdrop-blur-md border border-border rounded-xl shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {classroom.name}
              {classroom.deletedAt ? ' (eliminada)' : ''}
            </h1>
            <Badge
              variant="outline"
              className="font-mono bg-background capitalize"
            >
              {t(`shifts.${shift}`)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
            <Calendar className="size-4" />
            {academicYear.name} • {t('semester', { period })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() =>
              exportPDF(
                `horario-${classroom.name}-${academicYear.name}-P${period}`
              )
            }
            disabled={isExportingPDF}
            variant="outline"
            className="font-medium shadow-sm transition-all shrink-0 w-full sm:w-auto flex items-center gap-2"
          >
            {isExportingPDF ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Exportar PDF
          </Button>
        </div>
      </div>

      <ClassroomTimelineWeek
        gridRef={gridRef}
        daysOfWeek={daysOfWeek}
        startTimeMinutes={startTimeMinutes}
        endTimeMinutes={endTimeMinutes}
        events={timelineEvents}
        renderEvent={(event) => {
          const meta = slotMetaMap.get(event.subjectGroupId);
          const title = meta?.subject?.name ?? 'Clase';
          const group = meta?.group?.name;
          const degree = meta?.degree?.name;
          const colorClass =
            subjectPalette[
              hashString(meta?.subject?.id ?? event.subjectGroupId) %
                subjectPalette.length
            ];

          return (
            <div
              className={`h-full rounded-lg border p-2 shadow-sm overflow-hidden ${colorClass}`}
            >
              <div className="text-[11px] font-mono opacity-75">
                {formatMinutesAsTime(event.startTimeMinutes)}–
                {formatMinutesAsTime(event.endTimeMinutes)}
              </div>
              <div className="text-sm font-semibold line-clamp-2">{title}</div>
              <div className="text-xs opacity-80 line-clamp-2">
                {[group, degree].filter(Boolean).join(' · ')}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
