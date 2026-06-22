'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Loader2, ArchiveRestore } from 'lucide-react';
import { DraggableSlot } from '@/features/schedule/components/dnd/draggable-slot';
import { useScheduleExport } from '@/hooks/schedule/use-schedule-export';
import { useScheduleGrid } from '@/hooks/schedule/use-schedule-grid';
import { WeeklyScheduleGrid } from '@/components/shared/schedule/weekly-schedule-grid';
import type {
  Shift,
  ScheduleSlotDTO,
  ClassroomDTO,
  SubjectDTO,
  SubjectGroupDTO,
  DegreeDTO,
  AcademicYearDTO,
} from '@tfg-horarios/shared';
import { memo, useMemo } from 'react';

type ClassroomSchedulePlannerProps = {
  slots: ScheduleSlotDTO[];
  classroom: ClassroomDTO;
  subjects: SubjectDTO[];
  subjectGroups: SubjectGroupDTO[];
  degrees: DegreeDTO[];
  academicYear: AcademicYearDTO;
  shift: Shift;
  period: number;
};

type MemoizedScheduleCellProps = {
  cellSlots: ScheduleSlotDTO[];
  slotMetaMap: Map<
    string,
    {
      group: SubjectGroupDTO | undefined;
      subject: SubjectDTO | undefined;
      degree: DegreeDTO | undefined;
    }
  >;
  classroom: ClassroomDTO;
  subjectIdsPool: string[];
};

const MemoizedScheduleCell = memo(function MemoizedScheduleCell({
  cellSlots,
  slotMetaMap,
  subjectIdsPool,
}: MemoizedScheduleCellProps) {
  return (
    <div className="relative flex flex-col gap-1 p-1 rounded-lg border border-dashed border-border/50 bg-background/30 h-full min-h-22.5">
      {cellSlots.length > 0 &&
        cellSlots.map((slot) => {
          const meta = slotMetaMap.get(slot.subjectGroupId);
          if (!meta || !meta.subject || !meta.group) return null;
          return (
            <div key={slot.id} className="w-full">
              <div className="pointer-events-none">
                <DraggableSlot
                  slot={slot}
                  subject={meta.subject}
                  group={meta.group}
                  degree={meta.degree}
                  subjectIdsPool={subjectIdsPool}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
});

export function ClassroomSchedulePlanner({
  slots,
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
  const { slotTimeLabels, numSlots, startSlotIndex } = useScheduleGrid(
    academicYear,
    shift
  );

  const daysOfWeek = [
    { value: 1, label: t('days.1') },
    { value: 2, label: t('days.2') },
    { value: 3, label: t('days.3') },
    { value: 4, label: t('days.4') },
    { value: 5, label: t('days.5') },
  ];

  const slotsByCell = useMemo(() => {
    const map = new Map<string, ScheduleSlotDTO[]>();
    slots.forEach((s) => {
      const key = `${s.dayOfWeek}_${s.slotIndex}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      const cellSlots = map.get(key)!;
      if (
        !cellSlots.some(
          (existing) => existing.subjectGroupId === s.subjectGroupId
        )
      ) {
        cellSlots.push(s);
      }
    });
    return map;
  }, [slots]);

  const unassignedSlots = useMemo(() => {
    return slots.filter((s) => s.dayOfWeek === null || s.slotIndex === null);
  }, [slots]);

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

  const subjectIdsPool = useMemo(() => {
    const presentSubjectIds = new Set<string>();
    slots.forEach((slot) => {
      const meta = slotMetaMap.get(slot.subjectGroupId);
      if (meta && meta.subject) {
        presentSubjectIds.add(meta.subject.id);
      }
    });
    return Array.from(presentSubjectIds);
  }, [slots, slotMetaMap]);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-card/40 backdrop-blur-md border border-border rounded-xl shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {classroom.name}
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

      {unassignedSlots.length > 0 && (
        <div className="backdrop-blur-md border border-amber-200/50 bg-amber-50/10 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-500 font-medium text-sm">
            <ArchiveRestore className="size-4" />
            {t('unassignedSlotsTitle', {
              fallback: 'Clases por asignar a esta aula',
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            {unassignedSlots.map((slot) => {
              const meta = slotMetaMap.get(slot.subjectGroupId);
              if (!meta || !meta.subject || !meta.group) return null;
              return (
                <div key={slot.id} className="w-48 pointer-events-none">
                  <DraggableSlot
                    slot={slot}
                    subject={meta.subject}
                    group={meta.group}
                    degree={meta.degree}
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
        startSlotIndex={startSlotIndex}
        slotTimeLabels={slotTimeLabels}
        renderCell={(day, slotIndex) => {
          const cellSlots = slotsByCell.get(`${day}_${slotIndex}`) || [];
          return (
            <MemoizedScheduleCell
              cellSlots={cellSlots}
              slotMetaMap={slotMetaMap}
              classroom={classroom}
              subjectIdsPool={subjectIdsPool}
            />
          );
        }}
      />
    </div>
  );
}
