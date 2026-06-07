'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Building2, Download, Loader2 } from 'lucide-react';
import { DraggableSlot } from '@/features/schedule/components/dnd/draggable-slot';
import { useScheduleExport } from '@/hooks/schedule/use-schedule-export';
import { useScheduleGrid } from '@/hooks/schedule/use-schedule-grid';
import { WeeklyScheduleGrid } from '@/components/shared/schedule/weekly-schedule-grid';
import {
  type ScheduleSlotDTO,
  type ClassroomDTO,
  type SubjectDTO,
  type SubjectGroupDTO,
  type OrganizationDTO,
} from '@tfg-horarios/shared';

type ClassroomSchedulePlannerProps = {
  organization: OrganizationDTO;
  slots: ScheduleSlotDTO[];
  classroom: ClassroomDTO;
  subjects: SubjectDTO[];
  subjectGroups: SubjectGroupDTO[];
  academicYear: string;
  shift: 'morning' | 'afternoon';
  period: number;
};

type MemoizedScheduleCellProps = {
  cellSlots: ScheduleSlotDTO[];
  slotMetaMap: Map<
    string,
    { group: SubjectGroupDTO | undefined; subject: SubjectDTO | undefined }
  >;
  classroom: ClassroomDTO;
};

const MemoizedScheduleCell = React.memo(function MemoizedScheduleCell({
  cellSlots,
  slotMetaMap,
  classroom,
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
                  classroom={classroom}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
});

export function ClassroomSchedulePlanner({
  organization,
  slots,
  classroom,
  subjects,
  subjectGroups,
  academicYear,
  shift,
  period,
}: ClassroomSchedulePlannerProps) {
  const t = useTranslations('Organizations.classroomSchedules.planner');

  const { isExportingPDF, gridRef, exportPDF } = useScheduleExport();
  const { slotTimeLabels, numSlots } = useScheduleGrid(organization, shift);

  const daysOfWeek = [
    { value: 1, label: t('days.1') },
    { value: 2, label: t('days.2') },
    { value: 3, label: t('days.3') },
    { value: 4, label: t('days.4') },
    { value: 5, label: t('days.5') },
  ];

  const slotsByCell = React.useMemo(() => {
    const map = new Map<string, ScheduleSlotDTO[]>();
    slots.forEach((s) => {
      const key = `${s.dayOfWeek}_${s.slotIndex}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(s);
    });
    return map;
  }, [slots]);

  const slotMetaMap = React.useMemo(() => {
    const map = new Map<
      string,
      { group: SubjectGroupDTO | undefined; subject: SubjectDTO | undefined }
    >();
    subjectGroups.forEach((group) => {
      const subject = subjects.find((sub) => sub.id === group.subjectId);
      map.set(group.id, { group, subject });
    });
    return map;
  }, [subjectGroups, subjects]);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-card/40 backdrop-blur-md border border-border rounded-xl shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="size-8 text-indigo-500" />
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
            {academicYear} • {t('semester', { period })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => exportPDF(`horario-${classroom.name}-${academicYear}-P${period}`)}
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

      <WeeklyScheduleGrid
        gridRef={gridRef}
        daysOfWeek={daysOfWeek}
        numSlots={numSlots}
        slotTimeLabels={slotTimeLabels}
        renderCell={(day, slotIndex) => {
          const cellSlots = slotsByCell.get(`${day}_${slotIndex}`) || [];
          return (
            <MemoizedScheduleCell
              cellSlots={cellSlots}
              slotMetaMap={slotMetaMap}
              classroom={classroom}
            />
          );
        }}
      />
    </div>
  );
}
