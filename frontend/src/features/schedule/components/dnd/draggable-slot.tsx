'use client';

import { memo } from 'react';
import { useDraggable } from '@dnd-kit/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import {
  type ScheduleSlotDTO,
  type SubjectDTO,
  type SubjectGroupDTO,
  type ClassroomDTO,
  type DegreeDTO,
} from '@tfg-horarios/shared';
import { getSubjectColorClasses } from '@/lib/subject-colors';

type DraggableSlotProps = {
  slot: ScheduleSlotDTO;
  subject: SubjectDTO;
  group: SubjectGroupDTO;
  classroom?: ClassroomDTO;
  degree?: DegreeDTO;
  isOverlay?: boolean;
};

export const DraggableSlot = memo(function DraggableSlot({
  slot,
  subject,
  group,
  classroom,
  degree,
  isOverlay = false,
}: DraggableSlotProps) {
  const { isDragging, ref, handleRef } = useDraggable({
    id: slot.id,
    data: { slot, subject, group },
  });

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
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className={`border transition-all duration-200 shadow-sm flex-1 w-full flex flex-col
        ${getSubjectColorClasses(subject.id)}
        ${isOverlay ? 'shadow-xl pointer-events-none' : 'hover:brightness-95 dark:hover:brightness-110'}
      `}
    >
      <CardContent
        ref={handleRef}
        className="p-2.5 flex flex-col items-center justify-evenly gap-1 flex-1 w-full cursor-grab active:cursor-grabbing outline-none text-center"
      >
        <Badge
          variant="outline"
          className="text-[9px] uppercase px-1.5 py-0 shrink-0 opacity-80 border-current/30 text-center justify-center"
        >
          {group.groupType} {group.groupNumber}
        </Badge>

        <span className="text-xs font-bold break-words whitespace-normal leading-tight w-full">
          {subject.name}
        </span>

        {degree ? (
          <div className="flex items-center justify-center gap-1 border-t border-current/20 pt-2 text-[10px] opacity-90 w-full">
            <span className="font-semibold break-words whitespace-normal leading-tight">
              {degree.name}
            </span>
          </div>
        ) : classroom ? (
          <div className="flex items-center justify-center gap-1 border-t border-current/20 pt-2 text-[10px] opacity-90 w-full">
            <MapPin className="size-3 shrink-0" />
            <span className="font-semibold break-words whitespace-normal leading-tight">
              {classroom.name}
            </span>
          </div>
        ) : slot.classroomId ? (
          <div className="flex items-center justify-center gap-1 border-t border-current/20 pt-2 text-[10px] text-destructive dark:text-red-400 w-full">
            <MapPin className="size-3 shrink-0" />
            <span className="font-semibold break-words whitespace-normal leading-tight">
              Aula eliminada
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1 border-t border-current/20 pt-2 text-[10px] opacity-70 w-full">
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
