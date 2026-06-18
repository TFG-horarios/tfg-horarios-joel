'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScheduleExport } from '@/hooks/schedule/use-schedule-export';
import { useScheduleGrid } from '@/hooks/schedule/use-schedule-grid';
import { WeeklyScheduleGrid } from '@/components/shared/schedule/weekly-schedule-grid';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  type AcademicYearDTO,
} from '@tfg-horarios/shared';
import {
  publishScheduleAction,
  unpublishScheduleAction,
  updateScheduleSlotAction,
} from '@/features/schedule/actions';
import {
  Calendar,
  Download,
  Loader2,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
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
  academicYear: AcademicYearDTO;
};

type MemoizedScheduleCellProps = {
  cellId: string;
  cellSlots: ScheduleSlotDTO[];
  slotMetaMap: Map<
    string,
    { group: SubjectGroupDTO | undefined; subject: SubjectDTO | undefined }
  >;
  classroomMap: Map<string, ClassroomDTO>;
  dropHereText: string;
  subjectIdsPool: string[];
  onEditSlotClassroom: (slotId: string) => void;
  onUnassignSlot: (slotId: string) => void;
};

const MemoizedScheduleCell = React.memo(function MemoizedScheduleCell({
  cellId,
  cellSlots,
  slotMetaMap,
  classroomMap,
  dropHereText,
  subjectIdsPool,
  onEditSlotClassroom,
  onUnassignSlot,
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
          const classroom = slot.classroomId
            ? classroomMap.get(slot.classroomId)
            : undefined;
          return (
            <DraggableSlot
              key={slot.id}
              slot={slot}
              subject={meta.subject}
              group={meta.group}
              classroom={classroom}
              subjectIdsPool={subjectIdsPool}
              onEditClassroomClick={onEditSlotClassroom}
              onUnassignClick={onUnassignSlot}
            />
          );
        })
      ) : (
        <div className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-muted-foreground font-medium">
            {dropHereText}
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
  academicYear,
}: SchedulePlannerProps) {
  const router = useRouter();
  const t = useTranslations('Organizations.schedules');
  const [slots, setSlots] = useState<ScheduleSlotDTO[]>(initialSlots);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editingClassroomId, setEditingClassroomId] = useState<string>('none');
  const [isSavingClassroom, setIsSavingClassroom] = useState(false);

  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [localSchedule, setLocalSchedule] = useState<ScheduleDTO>(schedule);

  const { isExportingPDF, gridRef, exportPDF } = useScheduleExport();

  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  const maxMorningSlots = Math.floor(
    (parseTime(academicYear.morningEnd) -
      parseTime(academicYear.morningStart)) /
      academicYear.slotDurationMinutes
  );

  const effectiveShift = React.useMemo(() => {
    if (!localSchedule.shift) return 'global';

    const assignedSlots = slots
      .filter((s) => s.slotIndex !== null)
      .map((s) => s.slotIndex!);
    if (assignedSlots.length === 0) return localSchedule.shift;

    const maxSlot = Math.max(...assignedSlots);
    const minSlot = Math.min(...assignedSlots);

    if (localSchedule.shift === 'morning' && maxSlot >= maxMorningSlots) {
      return 'global';
    }
    if (localSchedule.shift === 'afternoon' && minSlot < maxMorningSlots) {
      return 'global';
    }

    return localSchedule.shift;
  }, [localSchedule.shift, slots, maxMorningSlots]);

  const { slotTimeLabels, numSlots, startSlotIndex } = useScheduleGrid(
    academicYear,
    effectiveShift
  );

  const unassignedSlots = React.useMemo(() => {
    return slots.filter((s) => s.dayOfWeek === null || s.slotIndex === null);
  }, [slots]);

  const daysOfWeek = [
    { value: 1, label: t('planner.days.1') },
    { value: 2, label: t('planner.days.2') },
    { value: 3, label: t('planner.days.3') },
    { value: 4, label: t('planner.days.4') },
    { value: 5, label: t('planner.days.5') },
  ];

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const result = await publishScheduleAction(
        organization.id,
        localSchedule.id
      );
      if (!result.success) {
        const errorMsg = result.message || '';
        const translated = errorMsg.startsWith('ERR_')
          ? t(`planner.errors.${errorMsg}`)
          : errorMsg || t('planner.failedPublish');
        toast.error(translated);
        return;
      }
      setLocalSchedule(result.data!);
      router.refresh();
      toast.success(t('actions.publishSuccess'));
    } catch (err) {
      console.error(err);
      toast.error(t('planner.failedPublish'));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsUnpublishing(true);
    try {
      const result = await unpublishScheduleAction(
        organization.id,
        localSchedule.id
      );
      if (!result.success) {
        throw new Error(result.message);
      }
      setLocalSchedule(result.data!);
      router.refresh();
      toast.success(
        t('actions.unpublishSuccess', {
          fallback: 'Horario ocultado correctamente',
        })
      );
    } catch (err) {
      console.error(err);
      toast.error(
        t('planner.failedUnpublish', {
          fallback: 'Error al establecer como borrador',
        })
      );
    } finally {
      setIsUnpublishing(false);
    }
  };

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

  const handleUnassignSlot = async (slotId: string) => {
    const currentSlot = slots.find((s) => s.id === slotId);
    if (
      !currentSlot ||
      (currentSlot.dayOfWeek === null && currentSlot.slotIndex === null)
    )
      return;

    const oldSlots = [...slots];
    const oldScheduleStatus = localSchedule.status;

    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? {
              ...s,
              dayOfWeek: null,
              slotIndex: null,
            }
          : s
      )
    );

    if (localSchedule.status === 'published') {
      setLocalSchedule((prev) => ({ ...prev, status: 'draft' }));
    }

    try {
      const result = await updateScheduleSlotAction(organization.id, slotId, {
        dayOfWeek: null,
        slotIndex: null,
      });
      if (!result.success) throw new Error(result.message);
    } catch (err) {
      setSlots(oldSlots);
      if (oldScheduleStatus === 'published') {
        setLocalSchedule((prev) => ({ ...prev, status: 'published' }));
      }
      const errorMsg =
        err instanceof Error ? err.message : t('planner.failedAssign');
      toast.error(
        errorMsg.startsWith('ERR_') ? t(`planner.errors.${errorMsg}`) : errorMsg
      );
    }
  };

  const handleEditClassroomClick = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    if (slot) {
      setEditingSlotId(slotId);
      setEditingClassroomId(slot.classroomId || 'none');
    }
  };

  const handleSaveClassroom = async () => {
    if (!editingSlotId) return;
    setIsSavingClassroom(true);
    const oldSlots = [...slots];
    try {
      const targetClassroom =
        editingClassroomId === 'none' ? null : editingClassroomId;
      setSlots((prev) =>
        prev.map((s) =>
          s.id === editingSlotId ? { ...s, classroomId: targetClassroom } : s
        )
      );

      const result = await updateScheduleSlotAction(
        organization.id,
        editingSlotId,
        {
          classroomId: targetClassroom,
        }
      );
      if (!result.success) {
        throw new Error(result.message);
      }
      toast.success(
        t('actions.updateSuccess', { fallback: 'Aula actualizada' })
      );
      setEditingSlotId(null);
    } catch (err) {
      setSlots(oldSlots);
      const errorMsg =
        err instanceof Error ? err.message : t('planner.failedAssign');

      if (errorMsg.includes('\n')) {
        const errors = errorMsg.split('\n');
        toast.error(t('planner.failedAssign'), {
          description: (
            <ul className="list-disc pl-4 space-y-1 mt-1">
              {errors.map((e, i) => {
                const translated = e.startsWith('ERR_')
                  ? t(`planner.errors.${e}`)
                  : e;
                return <li key={i}>{translated}</li>;
              })}
            </ul>
          ),
          duration: 5000,
        });
      } else {
        const translated = errorMsg.startsWith('ERR_')
          ? t(`planner.errors.${errorMsg}`)
          : errorMsg;
        toast.error(translated);
      }
    } finally {
      setIsSavingClassroom(false);
    }
  };

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

  const subjectIdsPool = React.useMemo(() => {
    const presentSubjectIds = new Set<string>();
    slots.forEach((slot) => {
      const meta = slotMetaMap.get(slot.subjectGroupId);
      if (meta && meta.subject) {
        presentSubjectIds.add(meta.subject.id);
      }
    });
    return Array.from(presentSubjectIds);
  }, [slots, slotMetaMap]);

  const classroomMap = React.useMemo(() => {
    return new Map(classrooms.map((c) => [c.id, c]));
  }, [classrooms]);

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

    let targetDay: number | null = null;
    let targetSlot: number | null = null;

    if (overId !== 'unassigned') {
      const parts = overId.split('_');
      if (parts.length !== 3 || parts[0] !== 'time') return;
      targetDay = parseInt(parts[1], 10);
      targetSlot = parseInt(parts[2], 10);
    }

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
    } catch (err) {
      setSlots(oldSlots);
      const errorMsg =
        err instanceof Error ? err.message : t('planner.failedAssign');

      if (errorMsg.includes('\n')) {
        const errors = errorMsg.split('\n');
        toast.error(t('planner.failedAssign'), {
          description: (
            <ul className="list-disc pl-4 space-y-1 mt-1">
              {errors.map((e, i) => {
                const translated = e.startsWith('ERR_')
                  ? t(`planner.errors.${e}`)
                  : e;
                return <li key={i}>{translated}</li>;
              })}
            </ul>
          ),
          duration: 5000,
        });
      } else {
        const translated = errorMsg.startsWith('ERR_')
          ? t(`planner.errors.${errorMsg}`)
          : errorMsg;
        toast.error(translated);
      }
    }
  };

  const activeSlotDTO = activeId ? slots.find((s) => s.id === activeId) : null;
  const activeMeta = activeSlotDTO
    ? slotMetaMap.get(activeSlotDTO.subjectGroupId)
    : null;

  return (
    <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col space-y-6">
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
                  ?.name ?? t('planner.globalItinerary')}
              </Badge>
              <Badge
                variant="outline"
                className="font-mono bg-background capitalize"
              >
                {localSchedule.shift} Shift
              </Badge>

              <Badge
                className={`
                  ${localSchedule.status === 'published' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' : ''}
                  ${localSchedule.status === 'draft' ? 'bg-blue-500/15 text-blue-500 border-blue-500/20' : ''}
                `}
              >
                {localSchedule.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-4" />
              {academicYear.name} • Semester {localSchedule.period}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {localSchedule.status === 'draft' ? (
              <Button
                onClick={handlePublish}
                disabled={isPublishing || unassignedSlots.length > 0}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md transition-all shrink-0 w-full sm:w-auto"
                title={
                  unassignedSlots.length > 0
                    ? t('planner.errors.ERR_SCHEDULE_HAS_UNASSIGNED_SLOTS')
                    : undefined
                }
              >
                {isPublishing
                  ? t('planner.publishing')
                  : t('planner.publishSchedule')}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleUnpublish}
                  disabled={isUnpublishing || isExportingPDF}
                  variant="outline"
                  className="font-medium text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 shadow-sm transition-all shrink-0 w-full sm:w-auto flex items-center gap-2"
                >
                  {isUnpublishing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Archive className="size-4" />
                  )}
                  {t('planner.unpublishSchedule', { fallback: 'Borrador' })}
                </Button>
                <Button
                  onClick={() =>
                    exportPDF(
                      `horario-${academicYear.name}-P${localSchedule.period}`
                    )
                  }
                  disabled={isExportingPDF || isUnpublishing}
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
              </>
            )}
          </div>
        </div>

        <div className="bg-card/40 backdrop-blur-md border border-border rounded-xl shadow-sm flex flex-col">
          <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <ArchiveRestore className="size-4 text-amber-500" />
              {t('planner.unassignedSlots')}
            </h2>
            <Badge variant="secondary">{unassignedSlots.length}</Badge>
          </div>
          <DroppableCell
            id="unassigned"
            className="w-full p-4 flex flex-wrap gap-3 min-h-[120px] items-start content-start"
          >
            {unassignedSlots.length === 0 ? (
              <div className="w-full text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg bg-background/50 pointer-events-none">
                {t('planner.noUnassignedSlots')}
              </div>
            ) : (
              unassignedSlots.map((slot) => {
                const meta = slotMetaMap.get(slot.subjectGroupId);
                if (!meta || !meta.subject || !meta.group) return null;
                const classroom = slot.classroomId
                  ? classroomMap.get(slot.classroomId)
                  : undefined;
                return (
                  <div key={slot.id} className="w-48">
                    <DraggableSlot
                      slot={slot}
                      subject={meta.subject}
                      group={meta.group}
                      classroom={classroom}
                      subjectIdsPool={subjectIdsPool}
                      onEditClassroomClick={handleEditClassroomClick}
                    />
                  </div>
                );
              })
            )}
          </DroppableCell>
        </div>

        <WeeklyScheduleGrid
          gridRef={gridRef}
          daysOfWeek={daysOfWeek}
          numSlots={numSlots}
          startSlotIndex={startSlotIndex}
          slotTimeLabels={slotTimeLabels}
          renderCell={(day, slotIndex) => {
            const cellId = `time_${day}_${slotIndex}`;
            const cellSlots = slotsByCell.get(`${day}_${slotIndex}`) || [];
            return (
              <MemoizedScheduleCell
                key={cellId}
                cellId={cellId}
                cellSlots={cellSlots}
                slotMetaMap={slotMetaMap}
                classroomMap={classroomMap}
                dropHereText={t('planner.dropHere')}
                subjectIdsPool={subjectIdsPool}
                onEditSlotClassroom={handleEditClassroomClick}
                onUnassignSlot={handleUnassignSlot}
              />
            );
          }}
        />

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
                classroom={
                  activeSlotDTO.classroomId
                    ? classroomMap.get(activeSlotDTO.classroomId)
                    : undefined
                }
                isOverlay
                subjectIdsPool={subjectIdsPool}
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>

      <Dialog
        open={!!editingSlotId}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSlotId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {t('planner.editClassroom', { fallback: 'Editar aula del slot' })}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="classroom" className="text-right">
                Aula
              </Label>
              <div className="col-span-3">
                <Select
                  value={editingClassroomId}
                  onValueChange={setEditingClassroomId}
                >
                  <SelectTrigger id="classroom">
                    <SelectValue placeholder="Seleccionar aula" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin aula asignada</SelectItem>
                    {classrooms.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.capacity} cap.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingSlotId(null)}
              disabled={isSavingClassroom}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveClassroom} disabled={isSavingClassroom}>
              {isSavingClassroom && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DragDropProvider>
  );
}
