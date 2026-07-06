'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Loader2 } from 'lucide-react';
import { useScheduleExport } from '@/components/shared/schedule/use-schedule-export';
import { getSubjectColorClasses } from '@/lib/utils/subject-colors';
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

  const subjectIdsPool = useMemo(() => {
    const presentSubjectIds = new Set<string>();
    timelineEvents.forEach((event) => {
      const meta = slotMetaMap.get(event.subjectGroupId);
      if (meta && meta.subject) {
        presentSubjectIds.add(meta.subject.id);
      } else {
        presentSubjectIds.add(event.subjectGroupId);
      }
    });
    return Array.from(presentSubjectIds);
  }, [timelineEvents, slotMetaMap]);

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
          const group = meta?.group
            ? getGroupLabel(meta.group.groupType, meta.group.groupNumber)
            : undefined;
          const degree = meta?.degree?.name;
          const colorClass = getSubjectColorClasses(
            meta?.subject?.id ?? event.subjectGroupId,
            subjectIdsPool
          );

          return (
            <div
              className={`h-full flex flex-col p-2 text-center rounded-lg border shadow-sm overflow-hidden text-black dark:text-white ${colorClass}`}
            >
              <div className="flex items-center justify-center gap-1.5 w-full mb-1.5">
                {group && (
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase px-1.5 py-0 h-4 shrink-0 opacity-80 border-current/30 text-black dark:text-white"
                  >
                    {group}
                  </Badge>
                )}
                <span className="text-[11px] font-mono font-medium opacity-80 tracking-tight">
                  {formatMinutesAsTime(event.startTimeMinutes)}-
                  {formatMinutesAsTime(event.endTimeMinutes)}
                </span>
              </div>

              <div className="flex-1 flex items-center justify-center w-full px-1">
                <span className="text-xs font-bold break-words whitespace-normal leading-tight line-clamp-3">
                  {title}
                </span>
              </div>

              {degree && (
                <div className="flex items-center justify-center border-t border-current/20 pt-2 mt-1 w-full opacity-90">
                  <span className="text-[11px] font-medium break-words whitespace-normal leading-tight line-clamp-2">
                    {degree}
                  </span>
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}

function getGroupLabel(groupType: string, groupNumber: number) {
  const prefix =
    groupType === 'theory'
      ? 'TE'
      : groupType === 'problems'
        ? 'PA'
        : groupType === 'practices'
          ? 'PE'
          : groupType === 'tutoring'
            ? 'TU'
            : groupType === 'reduced_practices'
              ? 'PX'
              : groupType;

  return `${prefix}${groupNumber}`;
}
