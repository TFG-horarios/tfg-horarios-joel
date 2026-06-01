'use client';

import { ResourceActionsToolbar } from '@/components/shared/resource/resource-actions-toolbar';
import { ClassroomBulkUploader } from '@/features/classroom/components/classroom-bulk-uploader';
import type { ClassroomDTO } from '@tfg-horarios/shared';
import { useTranslations } from 'next-intl';
import { deleteAllClassroomsAction } from '@/features/classroom/actions';

interface ClassroomActionsProps {
  organizationId: string;
  existingClassrooms: ClassroomDTO[];
}

export function ClassroomActions({
  organizationId,
  existingClassrooms,
}: ClassroomActionsProps) {
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
        <ClassroomBulkUploader
          organizationId={organizationId}
          existingClassrooms={existingClassrooms}
          mode="append"
        />
      }
      overwriteModalContent={
        <ClassroomBulkUploader
          organizationId={organizationId}
          existingClassrooms={existingClassrooms}
          mode="overwrite"
        />
      }
    />
  );
}
