'use client';

import { memo, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { deleteItineraryAction } from '@/features/itinerary/actions';
import { toast } from 'sonner';
import { ItineraryFormModal } from './itinerary-form-modal';
import type { DegreeDTO, ItineraryDTO } from '@tfg-horarios/shared';

export interface ItineraryCardProps {
  item: ItineraryDTO;
  degreeMap: Map<string, DegreeDTO>;
  translations: Record<string, string>;
}

export const ItineraryCard = memo(function ItineraryCard({
  item: itinerary,
  degreeMap,
  translations,
}: ItineraryCardProps) {
  const degree = degreeMap.get(itinerary.degreeId);
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <Card
        className={`h-full relative group ${organizationHoverCardClassName}`}
      >
        <ResourceCardActions
          itemName={itinerary.name}
          onEdit={() => setIsEditOpen(true)}
          onDelete={async () => {
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
          }}
        />
        <CardHeader className="space-y-2 p-5">
          <Badge
            variant="outline"
            className="w-fit font-mono uppercase tracking-[0.2em] border-purple-500/20 bg-purple-500/5 text-purple-500"
          >
            {itinerary.code}
          </Badge>
          <CardTitle
            className={`text-xl ${organizationHoverCardTitleClassName}`}
          >
            {itinerary.name}
          </CardTitle>
          <div className="pt-1 text-sm text-zinc-600 dark:text-zinc-400">
            <p className="font-medium text-black dark:text-white">
              {translations.degree}: {degree?.name ?? translations.unassigned}
            </p>
            <Badge
              variant="outline"
              className="mt-1 w-fit uppercase border-purple-500/20 bg-purple-500/5 text-purple-500"
            >
              {degree?.code
                ? `${translations.degreeCode}: ${degree.code}`
                : translations.noCode}
            </Badge>
          </div>
        </CardHeader>
      </Card>
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
