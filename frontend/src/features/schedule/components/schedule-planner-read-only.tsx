'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Archive, Calendar, Download, Loader2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useScheduleExport } from '@/components/shared/schedule/use-schedule-export';
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
  const [slots, setSlots] = useState(initialSlots);
  const { isExportingPDF, gridRef, exportPDF } = useScheduleExport();
  const { slotTimeLabels, numSlots, startSlotIndex, rows } = useScheduleGrid(
    academicYear,
    timeConfig
  );

  useEffect(() => {
    setSlots(initialSlots);
  }, [initialSlots]);

  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/organizations/${organization.id}/schedules/${schedule.id}/events`,
      { withCredentials: true }
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
    () => subjects.map((subject) => subject.id).sort(),
    [subjects]
  );

  const slotsByCell = useMemo(() => {
    const map = new Map<string, typeof slots>();
    slots.forEach((slot) => {
      if (slot.dayOfWeek === null || slot.slotIndex === null) return;
      const key = `${slot.dayOfWeek}_${slot.slotIndex}`;
      const current = map.get(key) ?? [];
      current.push(slot);
      map.set(key, current);
    });
    return map;
  }, [slots]);

  const unassignedSlots = useMemo(
    () =>
      slots.filter(
        (slot) =>
          slot.classroomId === null ||
          slot.dayOfWeek === null ||
          slot.slotIndex === null
      ),
    [slots]
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
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-card/40 backdrop-blur-md border border-border rounded-xl shadow-lg">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {scheduleDegree?.name ?? 'Common'}
              {scheduleDegree?.deletedAt ? ' (eliminado)' : ''}
            </h1>
            <Badge variant="outline" className="font-mono bg-background">
              Course Year {schedule.courseYear}
            </Badge>
            <Badge variant="outline" className="font-mono bg-background">
              {scheduleItinerary?.name ?? t('planner.globalItinerary')}
              {scheduleItinerary?.deletedAt ? ' (eliminado)' : ''}
            </Badge>
            <Badge
              variant="outline"
              className="font-mono bg-background capitalize"
            >
              {schedule.shift} Shift
            </Badge>
            <Badge
              className={
                schedule.status === 'published'
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20'
                  : 'bg-blue-500/15 text-blue-500 border-blue-500/20'
              }
            >
              {schedule.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
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

      {unassignedSlots.length > 0 && (
        <div className="bg-card/40 backdrop-blur-md border border-border rounded-xl shadow-sm flex flex-col">
          <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Archive className="size-4" />
              {t('planner.unassignedSlots')}
            </h2>
            <Badge variant="secondary">{unassignedSlots.length}</Badge>
          </div>
          <div className="w-full p-4 flex flex-wrap gap-3 min-h-30 items-start content-start">
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
                <div key={slot.id} className="w-48">
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
            <div className="relative flex flex-col gap-1 p-1 rounded-lg border border-dashed border-border h-full min-h-22.5">
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
      className={`border transition-all duration-200 shadow-sm flex-1 w-full flex flex-col relative
        ${getSubjectColorClasses(subjectId, subjectIdsPool)}
        ${hasConflicts ? 'border-destructive border-2' : ''}
        ${!hasConflicts && hasPlacementIssue ? 'border-amber-500 border-2' : ''}
      `}
    >
      <CardContent className="p-2.5 flex flex-col items-center justify-evenly gap-1 flex-1 w-full text-center">
        <Badge
          variant="outline"
          className="text-[9px] uppercase px-1.5 py-0 shrink-0 opacity-80 border-current/30 text-center justify-center text-black dark:text-white"
        >
          {groupLabel}
        </Badge>
        <span className="text-xs font-bold break-words whitespace-normal leading-tight w-full text-black dark:text-white">
          {subjectName}
        </span>
        <div className="flex items-center justify-center gap-1 border-t border-current/20 pt-2 text-[10px] opacity-90 w-full text-black dark:text-white">
          <MapPin className="size-3 shrink-0" />
          <span className="font-semibold break-words whitespace-normal leading-tight">
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
