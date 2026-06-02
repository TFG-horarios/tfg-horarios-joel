'use client';

import { ResourceActionsToolbar } from '@/components/shared/resource/resource-actions-toolbar';
import { DegreeBulkUploader } from '@/features/degree/components/degree-bulk-uploader';
import { useTranslations } from 'next-intl';
import { deleteAllDegreesAction } from '@/features/degree/actions';

interface DegreeActionsProps {
  organizationId: string;
}

export function DegreeActions({ organizationId }: DegreeActionsProps) {
  const t = useTranslations('Organizations.degrees.actions');

  return (
    <ResourceActionsToolbar
      onDeleteAll={() => deleteAllDegreesAction(organizationId)}
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
        <DegreeBulkUploader organizationId={organizationId} mode="append" />
      }
      overwriteModalContent={
        <DegreeBulkUploader organizationId={organizationId} mode="overwrite" />
      }
    />
  );
}
