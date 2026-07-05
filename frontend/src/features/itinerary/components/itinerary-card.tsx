'use client';

import { memo, useState } from 'react';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { cn } from '@/lib/utils/styles';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { deleteItineraryAction } from '@/features/itinerary/actions';
import { toast } from 'sonner';
import { ItineraryFormModal } from './itinerary-form-modal';
import type { DegreeDTO, ItineraryDTO } from '@tfg-horarios/shared';
import { GraduationCap } from 'lucide-react';

export interface ItineraryCardProps {
  item: ItineraryDTO;
  degreeMap: Map<string, DegreeDTO>;
  translations: Record<string, string>;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const ItineraryCard = memo(function ItineraryCard({
  item: itinerary,
  degreeMap,
  translations,
  canEdit,
  canDelete,
}: ItineraryCardProps) {
  const degree = degreeMap.get(itinerary.degreeId);
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <InteractiveCard
        className="h-full"
        actions={
          canEdit || canDelete ? (
            <ResourceCardActions
              itemName={itinerary.name}
              onEdit={canEdit ? () => setIsEditOpen(true) : undefined}
              onDelete={
                canDelete
                  ? async () => {
                      const res = await deleteItineraryAction(
                        itinerary.organizationId,
                        itinerary.degreeId,
                        itinerary.id
                      );
                      if (res.success) {
                        toast.success('Itinerario eliminado correctamente');
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
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-purple-border bg-brand-purple-bg text-brand-purple">
              {itinerary.code}
            </span>
          </div>
          <div className="flex flex-col flex-1 justify-center">
            <h3
              className={cn(
                'text-xl font-semibold transition-colors line-clamp-3',
                (canEdit || canDelete) && 'pr-12'
              )}
              title={itinerary.name}
            >
              {itinerary.name}
            </h3>
          </div>

          <div className="mt-auto pt-4 flex flex-wrap gap-2 justify-center">
            {degree?.code && (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80"
                title={translations.degree || 'Degree'}
              >
                <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">
                  {translations.degree}:{' '}
                  <strong className="text-foreground font-semibold uppercase">
                    {degree.code}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </InteractiveCard>

      <ItineraryFormModal
        organizationId={itinerary.organizationId}
        degrees={Array.from(degreeMap.values())}
        itinerary={itinerary}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
});
