'use client';

import { memo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { Map } from 'lucide-react';

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
        className={`h-full relative group flex flex-col ${organizationHoverCardClassName}`}
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
        <CardHeader className="flex flex-col space-y-3 p-5 pb-4">
          <Badge
            variant="outline"
            className="w-fit mx-auto font-mono uppercase tracking-widest border-purple-500/40 bg-purple-500/15 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200 flex items-center gap-1 px-2.5 py-0.5"
          >
            {itinerary.code}
          </Badge>
          <div className="flex items-center gap-3 pr-8">
            <div className="p-2.5 rounded-xl border shrink-0 border-purple-500/40 bg-purple-500/15 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200">
              <Map className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <CardTitle
                className={`text-xl leading-tight ${organizationHoverCardTitleClassName}`}
              >
                {itinerary.name}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 mt-auto flex flex-col gap-3">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {degree?.code && (
              <Badge
                variant="outline"
                className="w-fit font-mono uppercase tracking-widest border-purple-400/30 bg-purple-400/10 text-purple-600 dark:border-purple-400/20 dark:bg-purple-400/10 dark:text-purple-300 flex items-center gap-1 px-2.5 py-0.5"
              >
                <span>
                  {translations.degree}:{' '}
                  <strong className="font-semibold uppercase">
                    {degree.code}
                  </strong>
                </span>
              </Badge>
            )}
          </div>
        </CardContent>
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
