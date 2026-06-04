'use client';

import { useState } from 'react';

import { ResourceActionsToolbar } from '@/components/shared/resource/resource-actions-toolbar';
import { ItineraryBulkUploader } from '@/features/itinerary/components/itinerary-bulk-uploader';
import type { DegreeDTO } from '@tfg-horarios/shared';
import { useTranslations } from 'next-intl';
import { deleteAllItinerariesAction } from '@/features/itinerary/actions';
import { ItineraryFormModal } from './itinerary-form-modal';

interface ItineraryActionsProps {
  organizationId: string;
  degrees: DegreeDTO[];
}

export function ItineraryActions({
  organizationId,
  degrees,
}: ItineraryActionsProps) {
  const t = useTranslations('Organizations.itineraries.actions');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      <ResourceActionsToolbar
        onCreateClick={() => setIsCreateOpen(true)}
        onDeleteAll={() => deleteAllItinerariesAction(organizationId)}
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
            mode="append"
          />
        }
        overwriteModalContent={
          <ItineraryBulkUploader
            organizationId={organizationId}
            degrees={degrees}
            mode="overwrite"
          />
        }
      />
      <ItineraryFormModal
        organizationId={organizationId}
        degrees={degrees}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </>
  );
}
