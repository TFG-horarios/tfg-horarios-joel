'use client';

import { memo, useState } from 'react';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { deleteDegreeAction } from '@/features/degree/actions';
import { toast } from 'sonner';
import { DegreeFormModal } from './degree-form-modal';
import type { DegreeDTO } from '@tfg-horarios/shared';

export interface DegreeCardProps {
  item: DegreeDTO;
  translations?: Record<string, string>;
}

export const DegreeCard = memo(function DegreeCard({
  item: degree,
}: DegreeCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <InteractiveCard
        className="h-full"
        actions={
          <ResourceCardActions
            itemName={degree.name}
            onEdit={() => setIsEditOpen(true)}
            onDelete={async () => {
              const res = await deleteDegreeAction(
                degree.organizationId,
                degree.id
              );
              if (res.success) {
                toast.success('Grado eliminado correctamente');
              } else {
                toast.error(res.message);
              }
            }}
          />
        }
      >
        <div className="flex flex-col h-full w-full justify-center">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2 mb-4 justify-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300">
                {degree.code}
              </span>
            </div>
            <h3
              className="text-xl font-semibold transition-colors line-clamp-3 pr-12"
              title={degree.name}
            >
              {degree.name}
            </h3>
          </div>
        </div>
      </InteractiveCard>

      <DegreeFormModal
        organizationId={degree.organizationId}
        degree={degree}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
});
