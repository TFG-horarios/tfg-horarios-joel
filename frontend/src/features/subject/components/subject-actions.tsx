'use client';

import { ResourceActionsToolbar } from '@/components/shared/resource/resource-actions-toolbar';
import { SubjectBulkUploader } from '@/features/subject/components/subject-bulk-uploader';
import type { DegreeDTO, ItineraryDTO } from '@tfg-horarios/shared';
import { useTranslations } from 'next-intl';
import { deleteAllSubjectsAction } from '@/features/subject/actions';

interface SubjectActionsProps {
  organizationId: string;
  degrees: DegreeDTO[];
  itineraries: ItineraryDTO[];
}

export function SubjectActions({
  organizationId,
  degrees,
  itineraries,
}: SubjectActionsProps) {
  const t = useTranslations('Organizations.subjects.actions');

  return (
    <ResourceActionsToolbar
      onDeleteAll={() => deleteAllSubjectsAction(organizationId)}
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
        <SubjectBulkUploader
          organizationId={organizationId}
          degrees={degrees}
          itineraries={itineraries}
          mode="append"
        />
      }
      overwriteModalContent={
        <SubjectBulkUploader
          organizationId={organizationId}
          degrees={degrees}
          itineraries={itineraries}
          mode="overwrite"
        />
      }
    />
  );
}
