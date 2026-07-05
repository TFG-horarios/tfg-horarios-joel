'use client';

import { memo, useState } from 'react';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { deleteClassroomAction } from '@/features/classroom/actions';
import { toast } from 'sonner';
import { ClassroomFormModal } from './classroom-form-modal';
import type { ClassroomDTO } from '@tfg-horarios/shared';
import { Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils/styles';

export interface ClassroomCardProps {
  item: ClassroomDTO;
  translations: Record<string, string>;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const ClassroomCard = memo(function ClassroomCard({
  item: classroom,
  translations,
  canEdit,
  canDelete,
}: ClassroomCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <InteractiveCard
        className="h-full"
        actions={
          canEdit || canDelete ? (
            <ResourceCardActions
              itemName={classroom.name}
              onEdit={canEdit ? () => setIsEditOpen(true) : undefined}
              onDelete={
                canDelete
                  ? async () => {
                      const res = await deleteClassroomAction(
                        classroom.organizationId,
                        classroom.id
                      );
                      if (res.success) {
                        toast.success(res.message);
                      } else {
                        toast.error(res.message);
                      }
                    }
                  : undefined
              }
            />
          ) : undefined
        }
      >
        <div className="flex flex-col h-full w-full">
          <div className="flex flex-wrap items-center gap-2 mb-2 justify-center">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                classroom.type === 'theory'
                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
                  : classroom.type === 'computer_lab'
                    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300'
                    : 'bg-violet-500/10 text-violet-700 border-violet-500/30 dark:text-violet-300'
              )}
            >
              {classroom.type === 'theory'
                ? translations['type.theory']
                : classroom.type === 'computer_lab'
                  ? translations['type.computer_lab']
                  : translations['type.lab']}
            </span>
          </div>
          <div
            className={cn(
              'flex flex-col flex-1 justify-center',
              (canEdit || canDelete) && 'pr-12'
            )}
          >
            <h3
              className="text-xl font-semibold transition-colors line-clamp-3"
              title={classroom.name}
            >
              {classroom.name}
            </h3>
          </div>

          <div className="mt-auto pt-4 flex flex-wrap gap-2 justify-center">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80"
              title={translations.floor || 'Floor'}
            >
              <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>
                {translations.floor || 'Planta'} {classroom.floor}
              </span>
            </div>
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80"
              title={translations.capacity || 'Capacity'}
            >
              <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                <strong className="text-foreground font-semibold">
                  {classroom.capacity}
                </strong>{' '}
                {translations.capacity?.toLowerCase() || 'estudiantes'}
              </span>
            </div>
          </div>
        </div>
      </InteractiveCard>

      <ClassroomFormModal
        organizationId={classroom.organizationId}
        classroom={classroom}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
});
