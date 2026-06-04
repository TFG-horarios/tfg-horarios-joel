'use client';

import { memo, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ResourceRowActions } from '@/components/shared/resource/resource-row-actions';
import { deleteItineraryAction } from '@/features/itinerary/actions';
import { toast } from 'sonner';
import { ItineraryFormModal } from './itinerary-form-modal';
import type { ItineraryCardProps } from './itinerary-card';

export const ItineraryRow = memo(function ItineraryRow({
  item: itinerary,
  degreeMap,
  translations,
}: ItineraryCardProps) {
  const degree = degreeMap.get(itinerary.degreeId);
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{itinerary.name}</TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className="font-mono uppercase tracking-[0.2em] border-purple-500/20 bg-purple-500/5 text-purple-500"
          >
            {itinerary.code}
          </Badge>
        </TableCell>
        <TableCell>{degree?.name ?? translations.unassigned}</TableCell>
        <ResourceRowActions
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
      </TableRow>
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
