'use client';

import { ResourceActionsToolbar } from '@/components/shared/resource/resource-actions-toolbar';
import { ItineraryBulkUploader } from '@/features/itinerary/components/itinerary-bulk-uploader';
import type { ItineraryDTO, DegreeDTO } from '@tfg-horarios/shared';
import { useTranslations } from 'next-intl';
// import { deleteAllItinerariesAction } from '@/features/itinerary/actions';

interface ItineraryActionsProps {
  organizationId: string;
  existingItineraries: ItineraryDTO[];
  degrees: DegreeDTO[];
}

export function ItineraryActions({
  organizationId,
  existingItineraries,
  degrees,
}: ItineraryActionsProps) {
  const t = useTranslations('Organizations.itineraries.actions');

  return (
    <ResourceActionsToolbar
      /*onDeleteAll={() => deleteAllItinerariesAction(organizationId)}*/
      translations={{
        deleteAllConfirm: t('deleteAllConfirm'),
        deleteAllTitle: t('deleteAllTitle'),
        deleteAllDescription: t('deleteAllDescription'),
        deleting: t('deleting'),
        cancel: t('cancel'),
        import: t('import'),
        addFromCsv: t('addFromCsv'),
        replaceAll: t('replaceAll'),
        replaceAllWarning: t('replaceAllWarning'),
        create: t('create'),
      }}
      appendModalContent={
        <ItineraryBulkUploader
          organizationId={organizationId}
          degrees={degrees}
          existingItineraries={existingItineraries}
          mode="append"
        />
      }
      overwriteModalContent={
        <ItineraryBulkUploader
          organizationId={organizationId}
          degrees={degrees}
          existingItineraries={existingItineraries}
          mode="overwrite"
        />
      }
    />
  );
}
