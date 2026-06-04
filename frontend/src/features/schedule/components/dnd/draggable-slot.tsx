'use client';

import { memo } from 'react';
import { useDraggable } from '@dnd-kit/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen } from 'lucide-react';
import {
  type ScheduleSlotDTO,
  type SubjectDTO,
  type SubjectGroupDTO,
} from '@tfg-horarios/shared';

type DraggableSlotProps = {
  slot: ScheduleSlotDTO;
  subject: SubjectDTO;
  group: SubjectGroupDTO;
  isOverlay?: boolean;
};

export const DraggableSlot = memo(function DraggableSlot({
  slot,
  subject,
  group,
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
      className={`border bg-background/90 hover:bg-background transition-all duration-200 shadow-sm
        ${group.groupType === 'practices' ? 'border-purple-500/30' : 'border-blue-500/30'}
        ${isOverlay ? 'border-primary shadow-xl pointer-events-none' : 'hover:border-primary/50'}
      `}
    >
      <CardContent
        ref={handleRef}
        className="p-3 space-y-3 cursor-grab active:cursor-grabbing outline-none"
      >
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-foreground">
              {subject.name}
            </span>
            <Badge
              variant="outline"
              className={`text-[9px] uppercase scale-90 px-1 py-0
                ${group.groupType === 'practices' ? 'text-purple-500 border-purple-500/20 bg-purple-500/5' : 'text-blue-500 border-blue-500/20 bg-blue-500/5'}
              `}
            >
              {group.groupType}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <BookOpen className="size-3 text-indigo-500/80" />
            {group.name}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
          <span className="font-semibold flex items-center gap-1">
            <Users className="size-3" />
            {group.numberOfStudents} students
          </span>
          <span className="capitalize font-mono opacity-80">{group.shift}</span>
        </div>
      </CardContent>
    </Card>
  );
});
