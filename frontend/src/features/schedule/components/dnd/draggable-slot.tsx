'use client';

import { memo } from 'react';
import { useDraggable } from '@dnd-kit/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CircleHelp,
  MapPin,
  TriangleAlert,
  Pencil,
  X,
  Loader2,
} from 'lucide-react';
import {
  type ScheduleSlotDTO,
  type SubjectDTO,
  type SubjectGroupDTO,
  type ClassroomDTO,
  type DegreeDTO,
  type ScheduleConflictDetailDTO,
} from '@tfg-horarios/shared';
import { cn } from '@/lib/utils/styles';
import { getSubjectColorClasses } from '@/lib/utils/subject-colors';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';
import { formatConflictMessage } from './conflict-message';

type DraggableSlotProps = {
  slot: ScheduleSlotDTO;
  subject: SubjectDTO;
  group: SubjectGroupDTO;
  classroom?: ClassroomDTO;
  degree?: DegreeDTO;
  isOverlay?: boolean;
  subjectIdsPool?: string[];
  onEditClassroomClick?: (slotId: string) => void;
  onUnassignClick?: (slotId: string) => void;
  disabled?: boolean;
  isSaving?: boolean;
  conflictSubjectLabels?: ReadonlyMap<string, string>;
  classroomLabels?: ReadonlyMap<string, string>;
};

export const DraggableSlot = memo(function DraggableSlot({
  slot,
  subject,
  group,
  classroom,
  degree,
  isOverlay = false,
  subjectIdsPool,
  onEditClassroomClick,
  onUnassignClick,
  disabled = false,
  isSaving = false,
  conflictSubjectLabels,
  classroomLabels,
}: DraggableSlotProps) {
  const { isDragging, ref, handleRef } = useDraggable({
    id: slot.id,
    data: {
      slotId: slot.id,
      subjectGroupId: slot.subjectGroupId,
      subjectId: subject.id,
    },
    disabled: disabled || isSaving,
  });

  const tErrors = useTranslations('Organizations.schedules.planner.errors');
  const tPlanner = useTranslations('Organizations.schedules.planner');
  const placementIssues = slot.conflicts.filter((conflict) =>
    conflict.type.startsWith('UNASSIGNED')
  );
  const schedulingConflicts = slot.conflicts.filter(
    (conflict) => !conflict.type.startsWith('UNASSIGNED')
  );
  const hasConflicts = schedulingConflicts.length > 0;
  const hasPlacementIssue = placementIssues.length > 0;

  const getConflictMessage = (conflict: ScheduleConflictDetailDTO) => {
    return formatConflictMessage(
      conflict,
      group.numberOfStudents,
      (key, values) => tErrors(key, values),
      conflictSubjectLabels,
      classroomLabels
    );
  };

  return (
    <Card
      ref={ref}
      style={{
        opacity: isDragging && !isOverlay ? 0.4 : 1,
        boxShadow: isOverlay
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          : undefined,
        transform: isOverlay ? 'scale(1.05) rotate(2deg)' : undefined,
        zIndex: isOverlay ? 9999 : 20,
        cursor:
          disabled || isSaving ? 'default' : isDragging ? 'grabbing' : 'grab',
      }}
      className={`group relative flex w-full min-w-0 flex-1 flex-col overflow-hidden border shadow-sm transition-all duration-200 p-0
        ${getSubjectColorClasses(subject.id, subjectIdsPool)}
        ${isOverlay ? 'shadow-xl pointer-events-none' : 'hover:brightness-95 dark:hover:brightness-110'}
        ${hasConflicts ? 'border-destructive border-2' : ''}
        ${!hasConflicts && hasPlacementIssue ? 'border-amber-500 border-2' : ''}
        ${isSaving ? 'opacity-75' : ''}
      `}
    >
      {!isOverlay && isSaving && (
        <div className="absolute top-1 right-1 bg-background text-foreground rounded-full p-1 shadow-sm z-40 border">
          <Loader2 className="size-3 animate-spin" />
        </div>
      )}

      {/* Action Buttons (Top Left) */}
      {!isOverlay && !isSaving && onEditClassroomClick && (
        <div className="absolute top-1 left-1 flex gap-1 z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity focus-within:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onEditClassroomClick(slot.id);
            }}
            className="bg-primary/90 hover:bg-primary text-primary-foreground backdrop-blur-sm rounded-md p-1 shadow-sm transition-all cursor-pointer"
            title="Editar aula"
          >
            <Pencil className="size-3" />
          </button>
        </div>
      )}

      {/* Badges & Delete (Top Right) */}
      <div className="absolute top-1 right-1 flex gap-1 z-30">
        {!isOverlay && !isSaving && onUnassignClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onUnassignClick(slot.id);
            }}
            className="bg-destructive/90 hover:bg-destructive text-destructive-foreground backdrop-blur-sm rounded-md p-1 shadow-sm transition-all cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100"
            title={tPlanner('unassignSlot', { fallback: 'Descolocar slot' })}
          >
            <X className="size-3" />
          </button>
        )}

        {(hasConflicts || hasPlacementIssue) && (
          <>
            {hasConflicts && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-destructive text-destructive-foreground rounded-md p-1 shadow-sm cursor-help">
                      <TriangleAlert className="size-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs flex flex-col gap-1 z-[10000]">
                    <p className="font-semibold text-[10px] uppercase text-destructive-foreground/80 mb-1 border-b border-destructive-foreground/20 pb-1">
                      Conflictos
                    </p>
                    {schedulingConflicts.map((conflict, idx) => (
                      <div key={idx} className="flex gap-1.5 items-start">
                        <span className="mt-0.5">•</span>
                        <span className="text-xs leading-tight">
                          {getConflictMessage(conflict)}
                        </span>
                      </div>
                    ))}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {hasPlacementIssue && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-amber-500 text-white rounded-md p-1 shadow-sm cursor-help">
                      <CircleHelp className="size-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs flex flex-col gap-1 z-[10000]">
                    <p className="font-semibold text-[10px] uppercase mb-1 border-b pb-1">
                      {tPlanner('unassignedSlots')}
                    </p>
                    {placementIssues.map((issue, idx) => (
                      <div key={idx} className="flex gap-1.5 items-start">
                        <span className="mt-0.5">•</span>
                        <span className="text-xs leading-tight">
                          {getConflictMessage(issue)}
                        </span>
                      </div>
                    ))}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </>
        )}
      </div>
      <CardContent
        ref={handleRef}
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center justify-evenly gap-1.5 p-0.5 text-center outline-none sm:gap-3 sm:p-1',
          disabled || isSaving
            ? 'cursor-default'
            : 'cursor-grab active:cursor-grabbing'
        )}
      >
        <Badge
          variant="outline"
          className="max-w-full px-1 py-0 text-[8px] uppercase shrink-0 opacity-80 border-current/30 text-center justify-center text-black dark:text-white sm:px-1.5 sm:text-[9px]"
        >
          {group.groupType === 'theory'
            ? 'TE'
            : group.groupType === 'problems'
              ? 'PA'
              : group.groupType === 'practices'
                ? 'PE'
                : group.groupType === 'tutoring'
                  ? 'TU'
                  : group.groupType === 'reduced_practices'
                    ? 'PX'
                    : group.groupType}
          {group.groupNumber}
          {group.deletedAt ? ' (eliminado)' : ''}
        </Badge>

        <span className="w-full min-w-0 overflow-hidden break-words text-[10px] font-bold leading-tight text-black dark:text-white sm:text-xs">
          {subject.name}
          {subject.deletedAt ? ' (eliminada)' : ''}
        </span>

        {degree ? (
          <div className="flex w-full min-w-0 items-center justify-center gap-0.5 border-t border-current/20 pt-1 text-[9px] opacity-90 text-black dark:text-white sm:gap-1 sm:pt-2 sm:text-[10px]">
            <span className="min-w-0 break-words font-semibold leading-tight">
              {degree.name}
              {degree.deletedAt ? ' (eliminado)' : ''}
            </span>
          </div>
        ) : classroom ? (
          <div className="flex w-full min-w-0 items-center justify-center gap-0.5 border-t border-current/20 pt-1 text-[9px] opacity-90 text-black dark:text-white sm:gap-1 sm:pt-2 sm:text-[10px]">
            <MapPin className="size-2.5 shrink-0 sm:size-3" />
            <span className="min-w-0 break-words font-semibold leading-tight">
              {classroom.name}
              {classroom.deletedAt ? ' (eliminada)' : ''}
            </span>
          </div>
        ) : slot.classroomId ? null : (
          <div className="flex w-full min-w-0 items-center justify-center gap-0.5 border-t border-current/20 pt-1 text-[9px] opacity-70 text-black dark:text-white sm:gap-1 sm:pt-2 sm:text-[10px]">
            <MapPin className="size-2.5 shrink-0 sm:size-3" />
            <span className="min-w-0 break-words font-semibold leading-tight">
              Sin aula asignada
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
