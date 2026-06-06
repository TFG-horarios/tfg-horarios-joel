'use client';

import { memo, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
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
        <TableCell className="font-mono uppercase tracking-widest text-muted-foreground">
          {itinerary.code}
        </TableCell>
        <TableCell>{degree?.code ?? translations.unassigned}</TableCell>
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
