'use client';

import { ResourceActionsToolbar } from '@/components/shared/resource/resource-actions-toolbar';
import { ClassroomBulkUploader } from '@/features/classroom/components/classroom-bulk-uploader';
import { useTranslations } from 'next-intl';
import { deleteAllClassroomsAction } from '@/features/classroom/actions';

interface ClassroomActionsProps {
  organizationId: string;
}

export function ClassroomActions({ organizationId }: ClassroomActionsProps) {
  const t = useTranslations('Organizations.classrooms.actions');

  return (
    <ResourceActionsToolbar
      onDeleteAll={() => deleteAllClassroomsAction(organizationId)}
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
        <ClassroomBulkUploader organizationId={organizationId} mode="append" />
      }
      overwriteModalContent={
        <ClassroomBulkUploader
          organizationId={organizationId}
          mode="overwrite"
        />
      }
    />
  );
}
