'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { DraggableSlot } from './dnd/draggable-slot';
import { DroppableCell } from './dnd/droppable-cell';
import {
  type ScheduleDTO,
  type ScheduleSlotDTO,
  type ClassroomDTO,
  type SubjectDTO,
  type SubjectGroupDTO,
  type OrganizationDTO,
  type DegreeDTO,
  type ItineraryDTO,
} from '@tfg-horarios/shared';
import {
  publishScheduleAction,
  updateScheduleSlotAction,
} from '@/features/schedule/actions';
import { Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

type SchedulePlannerProps = {
  organization: OrganizationDTO;
  schedule: ScheduleDTO;
  initialSlots: ScheduleSlotDTO[];
  classrooms: ClassroomDTO[];
  subjects: SubjectDTO[];
  subjectGroups: SubjectGroupDTO[];
  degrees: DegreeDTO[];
  itineraries: ItineraryDTO[];
};

type MemoizedScheduleCellProps = {
  cellId: string;
  cellSlots: ScheduleSlotDTO[];
  slotMetaMap: Map<
    string,
    { group: SubjectGroupDTO | undefined; subject: SubjectDTO | undefined }
  >;
};

const MemoizedScheduleCell = React.memo(function MemoizedScheduleCell({
  cellId,
  cellSlots,
  slotMetaMap,
}: MemoizedScheduleCellProps) {
  return (
    <DroppableCell
      id={cellId}
      className="relative flex flex-col gap-1 p-1 rounded-lg border border-dashed border-border hover:bg-muted/20 hover:border-muted-foreground/30 h-full min-h-22.5"
    >
      {cellSlots.length > 0 ? (
        cellSlots.map((slot) => {
          const meta = slotMetaMap.get(slot.subjectGroupId);
          if (!meta || !meta.subject || !meta.group) return null;
          return (
            <div key={slot.id} className="w-full">
              <DraggableSlot
                slot={slot}
                subject={meta.subject}
                group={meta.group}
              />
            </div>
          );
        })
      ) : (
        <div className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-muted-foreground font-medium">
            Drop Here
          </span>
        </div>
      )}
    </DroppableCell>
  );
});

export function SchedulePlanner({
  organization,
  schedule,
  initialSlots,
  classrooms,
  subjects,
  subjectGroups,
  degrees,
  itineraries,
}: SchedulePlannerProps) {
  const router = useRouter();
  const t = useTranslations('Organizations.schedules');
  const [slots, setSlots] = useState<ScheduleSlotDTO[]>(initialSlots);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [localSchedule, setLocalSchedule] = useState<ScheduleDTO>(schedule);

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

    if (localSchedule.shift === 'morning') {
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
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
  ];

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const result = await publishScheduleAction(
        organization.id,
        localSchedule.id
      );
      if (!result.success) {
        throw new Error(result.message);
      }
      setLocalSchedule(result.data!);
      router.refresh();
      toast.success(t('actions.publishSuccess'));
    } catch (err) {
      console.error(err);
      toast.error('Failed to publish schedule.');
    } finally {
      setIsPublishing(false);
    }
  };

  const slotsByCell = React.useMemo(() => {
    const map = new Map<string, ScheduleSlotDTO[]>();
    slots.forEach((s) => {
      if (s.classroomId === null) return;
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

  const handleDragStart = (event: any) => {
    const active = event.active || event.operation?.source;
    setActiveId(active?.id || null);
  };

  const handleDragEnd = async (event: any) => {
    setActiveId(null);
    const active = event.active || event.operation?.source;
    const over = event.over || event.operation?.target;

    if (!active || !over) return;

    const slotId = active.id;
    const overId = over.id;

    const currentSlot = slots.find((s) => s.id === slotId);
    if (!currentSlot) return;

    const parts = overId.split('_');
    if (parts.length !== 3 || parts[0] !== 'time') return;
    const targetDay = parseInt(parts[1], 10);
    const targetSlot = parseInt(parts[2], 10);
    const targetClassroom =
      currentSlot.classroomId || classrooms[0]?.id || null;

    if (
      currentSlot.dayOfWeek === targetDay &&
      currentSlot.slotIndex === targetSlot
    ) {
      return;
    }

    const oldSlots = [...slots];
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? {
              ...s,
              classroomId: targetClassroom,
              dayOfWeek: targetDay,
              slotIndex: targetSlot,
            }
          : s
      )
    );

    try {
      const result = await updateScheduleSlotAction(organization.id, slotId, {
        classroomId: targetClassroom,
        dayOfWeek: targetDay,
        slotIndex: targetSlot,
      });
      if (!result.success) {
        throw new Error(result.message);
      }
    } catch {
      setSlots(oldSlots);
      toast.error('Failed to assign slot.');
    }
  };

  const activeSlotDTO = activeId ? slots.find((s) => s.id === activeId) : null;
  const activeMeta = activeSlotDTO ? slotMetaMap.get(activeSlotDTO.subjectGroupId) : null;

  return (
    <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-card/40 backdrop-blur-md border border-border rounded-xl shadow-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {degrees.find((d) => d.id === localSchedule.degreeId)?.name ??
                  'Common'}
              </h1>
              <Badge variant="outline" className="font-mono bg-background">
                Course Year {localSchedule.courseYear}
              </Badge>
              <Badge variant="outline" className="font-mono bg-background">
                {itineraries.find((i) => i.id === localSchedule.itineraryId)
                  ?.name ?? 'Global Itinerary'}
              </Badge>
              <Badge
                variant="outline"
                className="font-mono bg-background capitalize"
              >
                {localSchedule.shift} Shift
              </Badge>
              <Badge
                variant="outline"
                className="font-mono bg-background text-indigo-500"
              >
                {localSchedule.version}
              </Badge>
              <Badge
                className={`
                  ${localSchedule.status === 'published' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' : ''}
                  ${localSchedule.status === 'draft' ? 'bg-blue-500/15 text-blue-500 border-blue-500/20' : ''}
                  ${localSchedule.status === 'archived' ? 'bg-amber-500/15 text-amber-500 border-amber-500/20' : ''}
                `}
              >
                {localSchedule.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-4" />
              {localSchedule.academicYear} • Semester {localSchedule.period}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {localSchedule.status === 'draft' && (
              <Button
                onClick={handlePublish}
                disabled={isPublishing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md transition-all shrink-0 w-full sm:w-auto"
              >
                {isPublishing ? 'Publishing...' : 'Publish Version'}
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col h-[calc(100vh-16rem)] min-h-125 bg-card/30 backdrop-blur-sm border border-border rounded-xl shadow-inner overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="size-4 text-indigo-500" />
              Weekly Schedule View
            </h2>
          </div>

          <ScrollArea className="flex-1 w-full overflow-auto">
            <div className="min-w-200 p-6 space-y-4">
              <div className="grid grid-cols-6 gap-3">
                <div className="flex items-center justify-center p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20 rounded-lg">
                  Time
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
                      Block {idx + 1}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1">
                      {slotTimeLabels[idx]}
                    </span>
                  </div>

                  {daysOfWeek.map((day) => {
                    const cellId = `time_${day.value}_${idx}`;
                    const cellSlots = slotsByCell.get(`${day.value}_${idx}`) || [];
                    return (
                      <MemoizedScheduleCell
                        key={cellId}
                        cellId={cellId}
                        cellSlots={cellSlots}
                        slotMetaMap={slotMetaMap}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeSlotDTO &&
          activeMeta &&
          activeMeta.group &&
          activeMeta.subject ? (
            <div className="w-45">
              <DraggableSlot
                slot={activeSlotDTO}
                subject={activeMeta.subject}
                group={activeMeta.group}
                isOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DragDropProvider>
  );
}
