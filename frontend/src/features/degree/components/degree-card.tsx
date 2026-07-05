'use client';

import { memo, useState } from 'react';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { cn } from '@/lib/utils/styles';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { deleteDegreeAction } from '@/features/degree/actions';
import { toast } from 'sonner';
import { DegreeFormModal } from './degree-form-modal';
import type { DegreeDTO } from '@tfg-horarios/shared';

export interface DegreeCardProps {
  item: DegreeDTO;
  translations?: Record<string, string>;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const DegreeCard = memo(function DegreeCard({
  item: degree,
  canEdit,
  canDelete,
}: DegreeCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <InteractiveCard
        className="h-full"
        actions={
          canEdit || canDelete ? (
            <ResourceCardActions
              itemName={degree.name}
              onEdit={canEdit ? () => setIsEditOpen(true) : undefined}
              onDelete={
                canDelete
                  ? async () => {
                      const res = await deleteDegreeAction(
                        degree.organizationId,
                        degree.id
                      );
                      if (res.success) {
                        toast.success('Grado eliminado correctamente');
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
        <div className="flex flex-col h-full w-full justify-center">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2 mb-4 justify-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-purple-border bg-brand-purple-bg text-brand-purple">
                {degree.code}
              </span>
            </div>
            <h3
              className={cn(
                'text-xl font-semibold transition-colors line-clamp-3',
                (canEdit || canDelete) && 'pr-12'
              )}
              title={degree.name}
            >
              {degree.name}
            </h3>
          </div>
        </div>
      </InteractiveCard>

      {isEditOpen && (
        <DegreeFormModal
          organizationId={degree.organizationId}
          degree={degree}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}
    </>
  );
});
