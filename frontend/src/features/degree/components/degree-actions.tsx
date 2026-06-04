'use client';

import { useState } from 'react';

import { ResourceActionsToolbar } from '@/components/shared/resource/resource-actions-toolbar';
import { DegreeBulkUploader } from '@/features/degree/components/degree-bulk-uploader';
import { useTranslations } from 'next-intl';
import { deleteAllDegreesAction } from '@/features/degree/actions';
import { DegreeFormModal } from './degree-form-modal';

interface DegreeActionsProps {
  organizationId: string;
}

export function DegreeActions({ organizationId }: DegreeActionsProps) {
  const t = useTranslations('Organizations.degrees.actions');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      <ResourceActionsToolbar
        onCreateClick={() => setIsCreateOpen(true)}
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
          <DegreeBulkUploader
            organizationId={organizationId}
            mode="overwrite"
          />
        }
      />
      <DegreeFormModal
        organizationId={organizationId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </>
  );
}
