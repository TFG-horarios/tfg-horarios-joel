'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DraggableSlot } from '@/features/schedule/components/dnd/draggable-slot';
import {
  type ScheduleSlotDTO,
  type ClassroomDTO,
  type SubjectDTO,
  type SubjectGroupDTO,
  type OrganizationDTO,
} from '@tfg-horarios/shared';
import { Calendar, Clock, Building2 } from 'lucide-react';

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

  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  const formatTime = (minutesTotal: number) => {
    const h = Math.floor(minutesTotal / 60)
      .toString()
      .padStart(2, '0');
    const m = Math.floor(minutesTotal % 60)
      .toString()
      .padStart(2, '0');
    return `${h}:${m}`;
  };

  const generateTimeLabels = () => {
    let startMins;
    let endMins;

    if (shift === 'morning') {
      startMins = parseTime(organization.morningStart);
      endMins = parseTime(organization.morningEnd);
    } else {
      startMins = parseTime(organization.afternoonStart);
      endMins = parseTime(organization.afternoonEnd);
    }

    const count = Math.floor(
      (endMins - startMins) / organization.slotDurationMinutes
    );
    const labels: Record<number, string> = {};

    for (let i = 0; i < count; i++) {
      const slotStart = startMins + i * organization.slotDurationMinutes;
      const slotEnd = slotStart + organization.slotDurationMinutes;
      labels[i] = `${formatTime(slotStart)} - ${formatTime(slotEnd)}`;
    }
    return labels;
  };

  const slotTimeLabels = generateTimeLabels();
  const numSlots = Object.keys(slotTimeLabels).length;

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
      </div>

      <div className="flex flex-col h-[calc(100vh-16rem)] min-h-125 bg-card/30 backdrop-blur-sm border border-border rounded-xl shadow-inner overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="size-4 text-indigo-500" />
            {t('weeklyView')}
          </h2>
        </div>

        <ScrollArea className="flex-1 w-full overflow-auto">
          <div className="min-w-200 p-6 space-y-4">
            <div className="grid grid-cols-6 gap-3">
              <div className="flex items-center justify-center p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20 rounded-lg">
                {t('time')}
              </div>
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

            {Array.from({ length: numSlots }).map((_, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-3 min-h-22.5">
                <div className="flex flex-col items-center justify-center p-3 bg-muted/20 border border-dashed border-border rounded-lg text-center">
                  <span className="text-xs font-semibold text-foreground font-mono">
                    {t('block', { index: idx + 1 })}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono mt-1">
                    {slotTimeLabels[idx]}
                  </span>
                </div>

                {daysOfWeek.map((day) => {
                  const cellSlots =
                    slotsByCell.get(`${day.value}_${idx}`) || [];
                  return (
                    <MemoizedScheduleCell
                      key={`${day.value}_${idx}`}
                      cellSlots={cellSlots}
                      slotMetaMap={slotMetaMap}
                      classroom={classroom}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
