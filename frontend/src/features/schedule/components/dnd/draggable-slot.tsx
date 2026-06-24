'use client';

import { memo } from 'react';
import { useDraggable } from '@dnd-kit/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleHelp, MapPin, TriangleAlert, Pencil, X } from 'lucide-react';
import {
  type ScheduleSlotDTO,
  type SubjectDTO,
  type SubjectGroupDTO,
  type ClassroomDTO,
  type DegreeDTO,
  type ScheduleConflictDetailDTO,
} from '@tfg-horarios/shared';
import { cn } from '@/lib/utils';
import { getSubjectColorClasses } from '@/lib/subject-colors';
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
  conflictSubjectLabels,
  classroomLabels,
}: DraggableSlotProps) {
  const { isDragging, ref, handleRef } = useDraggable({
    id: slot.id,
    data: { slot, subject, group },
    disabled,
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
        cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
      }}
      className={`border transition-all duration-200 shadow-sm flex-1 w-full flex flex-col relative group
        ${getSubjectColorClasses(subject.id, subjectIdsPool)}
        ${isOverlay ? 'shadow-xl pointer-events-none' : 'hover:brightness-95 dark:hover:brightness-110'}
        ${hasConflicts ? 'border-destructive border-2' : ''}
        ${!hasConflicts && hasPlacementIssue ? 'border-amber-500 border-2' : ''}
      `}
    >
      {!isOverlay && onEditClassroomClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onEditClassroomClick(slot.id);
          }}
          className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full p-1 shadow-md z-30 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 cursor-pointer"
          title="Editar aula"
        >
          <Pencil className="size-3" />
        </button>
      )}
      {!isOverlay && onUnassignClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onUnassignClick(slot.id);
          }}
          className="absolute -top-2 left-5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md z-30 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 cursor-pointer"
          title={tPlanner('unassignSlot', { fallback: 'Descolocar slot' })}
        >
          <X className="size-3" />
        </button>
      )}
      {hasConflicts && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md z-30 cursor-help">
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
              <div
                className={`absolute -top-2 ${hasConflicts ? 'right-5' : '-right-2'} bg-amber-500 text-white rounded-full p-1 shadow-md z-30 cursor-help`}
              >
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
      <CardContent
        ref={handleRef}
        className={cn(
          'p-2.5 flex flex-col items-center justify-evenly gap-1 flex-1 w-full outline-none text-center',
          disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        )}
      >
        <Badge
          variant="outline"
          className="text-[9px] uppercase px-1.5 py-0 shrink-0 opacity-80 border-current/30 text-center justify-center text-black dark:text-white"
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

        <span className="text-xs font-bold break-words whitespace-normal leading-tight w-full text-black dark:text-white">
          {subject.name}
          {subject.deletedAt ? ' (eliminada)' : ''}
        </span>

        {degree ? (
          <div className="flex items-center justify-center gap-1 border-t border-current/20 pt-2 text-[10px] opacity-90 w-full text-black dark:text-white">
            <span className="font-semibold break-words whitespace-normal leading-tight">
              {degree.name}
              {degree.deletedAt ? ' (eliminado)' : ''}
            </span>
          </div>
        ) : classroom ? (
          <div className="flex items-center justify-center gap-1 border-t border-current/20 pt-2 text-[10px] opacity-90 w-full text-black dark:text-white">
            <MapPin className="size-3 shrink-0" />
            <span className="font-semibold break-words whitespace-normal leading-tight">
              {classroom.name}
              {classroom.deletedAt ? ' (eliminada)' : ''}
            </span>
          </div>
        ) : slot.classroomId ? null : (
          <div className="flex items-center justify-center gap-1 border-t border-current/20 pt-2 text-[10px] opacity-70 w-full text-black dark:text-white">
            <MapPin className="size-3 shrink-0" />
            <span className="font-semibold break-words whitespace-normal leading-tight">
              Sin aula asignada
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
