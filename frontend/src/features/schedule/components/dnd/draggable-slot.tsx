'use client';

import { memo } from 'react';
import { useDraggable } from '@dnd-kit/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, MapPin } from 'lucide-react';
import {
  type ScheduleSlotDTO,
  type SubjectDTO,
  type SubjectGroupDTO,
  type ClassroomDTO,
} from '@tfg-horarios/shared';
import { getSubjectColorClasses } from '@/lib/subject-colors';

type DraggableSlotProps = {
  slot: ScheduleSlotDTO;
  subject: SubjectDTO;
  group: SubjectGroupDTO;
  classroom?: ClassroomDTO;
  isOverlay?: boolean;
};

export const DraggableSlot = memo(function DraggableSlot({
  slot,
  subject,
  group,
  classroom,
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
        position:
          !isOverlay && slot.duration && slot.duration !== 1
            ? 'absolute'
            : undefined,
        top: !isOverlay && slot.duration && slot.duration !== 1 ? 4 : undefined,
        left:
          !isOverlay && slot.duration && slot.duration !== 1 ? 4 : undefined,
        right:
          !isOverlay && slot.duration && slot.duration !== 1 ? 4 : undefined,
        height:
          !isOverlay && slot.duration && slot.duration !== 1
            ? `calc(100% * ${slot.duration} + 12px * ${slot.duration - 1} - 8px)`
            : '100%',
      }}
      className={`border transition-all duration-200 shadow-sm
        ${getSubjectColorClasses(subject.id)}
        ${isOverlay ? 'shadow-xl pointer-events-none' : 'hover:brightness-95 dark:hover:brightness-110'}
      `}
    >
      <CardContent
        ref={handleRef}
        className="p-3 space-y-3 cursor-grab active:cursor-grabbing outline-none"
      >
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold break-words whitespace-normal leading-tight">
              {subject.name}
            </span>
            <Badge
              variant="outline"
              className={`text-[9px] uppercase scale-90 px-1 py-0 shrink-0 opacity-80 border-current/30
              `}
            >
              {group.groupType}
            </Badge>
          </div>
          <p className="text-[10px] font-medium flex items-center gap-1 opacity-80">
            <BookOpen className="size-3" />
            {group.name}
          </p>
        </div>

        {classroom ? (
          <div className="flex items-center gap-1 border-t border-current/20 pt-2 text-[10px] opacity-90">
            <MapPin className="size-3 shrink-0" />
            <span className="font-semibold break-words whitespace-normal">
              {classroom.name}
            </span>
          </div>
        ) : slot.classroomId ? (
          <div className="flex items-center gap-1 border-t border-current/20 pt-2 text-[10px] text-destructive dark:text-red-400">
            <MapPin className="size-3 shrink-0" />
            <span className="font-semibold break-words whitespace-normal">
              Aula eliminada
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 border-t border-current/20 pt-2 text-[10px] opacity-70">
            <MapPin className="size-3 shrink-0" />
            <span className="font-semibold break-words whitespace-normal">
              Sin aula asignada
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
