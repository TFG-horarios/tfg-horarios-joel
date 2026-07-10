'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Archive, Calendar, Download, Loader2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useScheduleExport } from '@/components/shared/schedule/use-schedule-export';
import { createApiEventSource } from '@/lib/api/realtime';
import { getSubjectColorClasses } from '@/lib/utils/subject-colors';
import { useScheduleGrid } from '../hooks/use-schedule-grid';
import type { SchedulePlannerProps } from './schedule-planner-editor';
import { WeeklyScheduleGrid } from './weekly-schedule-grid';

export function SchedulePlannerReadOnly({
  organization,
  schedule,
  initialSlots,
  classrooms,
  subjects,
  subjectGroups,
  degrees,
  itineraries,
  academicYear,
  timeConfig,
}: SchedulePlannerProps) {
  const router = useRouter();
  const t = useTranslations('Organizations.schedules');
  const { isExportingPDF, gridRef, exportPDF } = useScheduleExport();
  const { slotTimeLabels, numSlots, startSlotIndex, rows } = useScheduleGrid(
    academicYear,
    timeConfig
  );

  useEffect(() => {
    const eventSource = createApiEventSource(
      `/api/organizations/${organization.id}/schedules/${schedule.id}/events`
    );

    eventSource.addEventListener('schedule_updated', () => {
      router.refresh();
    });

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [organization.id, router, schedule.id]);

  const subjectMap = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects]
  );

  const groupMap = useMemo(
    () => new Map(subjectGroups.map((group) => [group.id, group])),
    [subjectGroups]
  );

  const classroomMap = useMemo(
    () => new Map(classrooms.map((classroom) => [classroom.id, classroom])),
    [classrooms]
  );

  const subjectIdsPool = useMemo(
    () =>
      subjects.map((subject) => subject.id).sort((a, b) => a.localeCompare(b)),
    [subjects]
  );

  const slotsByCell = useMemo(() => {
    const map = new Map<string, typeof initialSlots>();
    initialSlots.forEach((slot) => {
      if (slot.dayOfWeek === null || slot.slotIndex === null) return;
      const key = `${slot.dayOfWeek}_${slot.slotIndex}`;
      const current = map.get(key) ?? [];
      current.push(slot);
      map.set(key, current);
    });
    return map;
  }, [initialSlots]);

  const unassignedSlots = useMemo(
    () =>
      initialSlots.filter(
        (slot) =>
          slot.classroomId === null ||
          slot.dayOfWeek === null ||
          slot.slotIndex === null
      ),
    [initialSlots]
  );

  const daysOfWeek = [
    { value: 1, label: t('planner.days.1') },
    { value: 2, label: t('planner.days.2') },
    { value: 3, label: t('planner.days.3') },
    { value: 4, label: t('planner.days.4') },
    { value: 5, label: t('planner.days.5') },
  ];

  const scheduleDegree = degrees.find(
    (degree) => degree.id === schedule.degreeId
  );
  const scheduleItinerary = itineraries.find(
    (itinerary) => itinerary.id === schedule.itineraryId
  );

  return (
    <div className="flex w-full max-w-full min-w-0 flex-col space-y-4 overflow-hidden sm:space-y-6">
      <div className="flex w-full max-w-full min-w-0 flex-col items-start justify-between gap-3 overflow-hidden rounded-xl border border-border bg-card/40 p-3 shadow-lg backdrop-blur-md sm:gap-4 sm:p-6 md:flex-row md:items-center">
        <div className="w-full min-w-0 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="min-w-0 w-full break-words text-xl font-bold leading-tight tracking-tight text-foreground sm:w-auto sm:text-3xl">
              {scheduleDegree?.name ?? 'Common'}
              {scheduleDegree?.deletedAt ? ' (eliminado)' : ''}
            </h1>
            <Badge
              variant="outline"
              className="min-w-0 max-w-full shrink overflow-hidden truncate bg-background font-mono text-[10px] sm:text-xs"
            >
              Course Year {schedule.courseYear}
            </Badge>
            <Badge
              variant="outline"
              className="h-auto min-w-0 max-w-full shrink overflow-hidden whitespace-normal break-words bg-background text-left font-mono text-[10px] sm:text-xs"
            >
              {scheduleItinerary?.name ?? t('planner.globalItinerary')}
              {scheduleItinerary?.deletedAt ? ' (eliminado)' : ''}
            </Badge>
            <Badge
              variant="outline"
              className="min-w-0 max-w-full shrink overflow-hidden truncate bg-background font-mono text-[10px] capitalize sm:text-xs"
            >
              {schedule.shift} Shift
            </Badge>
            <Badge
              className={`min-w-0 max-w-full shrink overflow-hidden truncate text-[10px] sm:text-xs ${
                schedule.status === 'published'
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20'
                  : 'bg-blue-500/15 text-blue-500 border-blue-500/20'
              }`}
            >
              {schedule.status.toUpperCase()}
            </Badge>
          </div>
          <p className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            {academicYear.name} • Semester {schedule.period}
          </p>
        </div>

        <Button
          onClick={() =>
            exportPDF(`horario-${academicYear.name}-P${schedule.period}`)
          }
          disabled={isExportingPDF}
          variant="outline"
          className="flex w-full min-w-0 items-center gap-2 overflow-hidden font-medium shadow-sm transition-all sm:w-auto"
        >
          {isExportingPDF ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          <span className="truncate">Exportar PDF</span>
        </Button>
      </div>

      {unassignedSlots.length > 0 && (
        <div className="flex w-full max-w-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card/40 shadow-sm backdrop-blur-md">
          <div className="flex min-w-0 items-center justify-between border-b border-border bg-muted/30 p-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Archive className="size-4" />
              {t('planner.unassignedSlots')}
            </h2>
            <Badge variant="secondary">{unassignedSlots.length}</Badge>
          </div>
          <div className="flex min-h-30 w-full min-w-0 flex-wrap content-start items-start gap-2 p-3 sm:gap-3 sm:p-4">
            {unassignedSlots.map((slot) => {
              const group = groupMap.get(slot.subjectGroupId);
              const subject = group
                ? subjectMap.get(group.subjectId)
                : undefined;
              if (!group || !subject) return null;
              const classroom = slot.classroomId
                ? classroomMap.get(slot.classroomId)
                : undefined;

              return (
                <div key={slot.id} className="w-full min-w-0 sm:w-48">
                  <ReadOnlySlot
                    slot={slot}
                    subjectName={subject.name}
                    subjectId={subject.id}
                    groupLabel={getGroupLabel(
                      group.groupType,
                      group.groupNumber
                    )}
                    classroomName={classroom?.name}
                    subjectIdsPool={subjectIdsPool}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <WeeklyScheduleGrid
        gridRef={gridRef}
        daysOfWeek={daysOfWeek}
        numSlots={numSlots}
        rows={rows}
        startSlotIndex={startSlotIndex}
        slotTimeLabels={slotTimeLabels}
        renderCell={(day, slotIndex) => {
          const cellSlots = slotsByCell.get(`${day}_${slotIndex}`) ?? [];
          return (
            <div className="relative flex h-full min-h-17 min-w-0 flex-col gap-0.5 overflow-hidden rounded-lg border border-dashed border-border p-0.5 sm:min-h-22.5 sm:gap-1 sm:p-1">
              {cellSlots.map((slot) => {
                const group = groupMap.get(slot.subjectGroupId);
                const subject = group
                  ? subjectMap.get(group.subjectId)
                  : undefined;
                if (!group || !subject) return null;
                const classroom = slot.classroomId
                  ? classroomMap.get(slot.classroomId)
                  : undefined;

                return (
                  <ReadOnlySlot
                    key={slot.id}
                    slot={slot}
                    subjectName={subject.name}
                    subjectId={subject.id}
                    groupLabel={getGroupLabel(
                      group.groupType,
                      group.groupNumber
                    )}
                    classroomName={classroom?.name}
                    subjectIdsPool={subjectIdsPool}
                  />
                );
              })}
            </div>
          );
        }}
      />
    </div>
  );
}

function ReadOnlySlot({
  slot,
  subjectName,
  subjectId,
  groupLabel,
  classroomName,
  subjectIdsPool,
}: {
  slot: SchedulePlannerProps['initialSlots'][number];
  subjectName: string;
  subjectId: string;
  groupLabel: string;
  classroomName?: string;
  subjectIdsPool: string[];
}) {
  const hasConflicts = slot.conflicts.some(
    (conflict) => !conflict.type.startsWith('UNASSIGNED')
  );
  const hasPlacementIssue = slot.conflicts.some((conflict) =>
    conflict.type.startsWith('UNASSIGNED')
  );

  return (
    <Card
      className={`relative flex w-full min-w-0 flex-1 flex-col overflow-hidden border shadow-sm transition-all duration-200
        ${getSubjectColorClasses(subjectId, subjectIdsPool)}
        ${hasConflicts ? 'border-destructive border-2' : ''}
        ${!hasConflicts && hasPlacementIssue ? 'border-amber-500 border-2' : ''}
      `}
    >
      <CardContent className="flex min-w-0 flex-1 flex-col items-center justify-evenly gap-1 p-1 text-center sm:p-2.5">
        <Badge
          variant="outline"
          className="max-w-full px-1 py-0 text-[8px] uppercase shrink-0 opacity-80 border-current/30 text-center justify-center text-black dark:text-white sm:px-1.5 sm:text-[9px]"
        >
          {groupLabel}
        </Badge>
        <span className="w-full min-w-0 overflow-hidden break-words text-[10px] font-bold leading-tight text-black dark:text-white sm:text-xs">
          {subjectName}
        </span>
        <div className="flex w-full min-w-0 items-center justify-center gap-0.5 border-t border-current/20 pt-1 text-[9px] opacity-90 text-black dark:text-white sm:gap-1 sm:pt-2 sm:text-[10px]">
          <MapPin className="size-2.5 shrink-0 sm:size-3" />
          <span className="min-w-0 break-words font-semibold leading-tight">
            {classroomName ?? 'Sin aula asignada'}
          </span>
        </div>
      </CardContent>
    </Card>
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
