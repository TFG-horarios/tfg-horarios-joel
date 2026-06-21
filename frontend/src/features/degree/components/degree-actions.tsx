'use client';

import { useState } from 'react';

import { ResourceActionsToolbar } from '@/components/shared/resource/resource-actions-toolbar';
import { DegreeBulkUploader } from '@/features/degree/components/degree-bulk-uploader';
import { useTranslations } from 'next-intl';
import {
  deleteAllDegreesAction,
  fetchAllDegreesAction,
} from '@/features/degree/actions';
import { DegreeFormModal } from './degree-form-modal';
import { downloadCsv } from '@/lib/utils/csv';

interface DegreeActionsProps {
  organizationId: string;
  canCreate?: boolean;
  canDeleteAll?: boolean;
  canImport?: boolean;
  canReplaceAll?: boolean;
}

export function DegreeActions({
  organizationId,
  canCreate,
  canDeleteAll,
  canImport,
  canReplaceAll,
}: DegreeActionsProps) {
  const t = useTranslations('Organizations.degrees.actions');
  const tCommon = useTranslations('Common.actions');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleExportCsv = async () => {
    const data = await fetchAllDegreesAction(organizationId);
    const csvData = data.map((item) => ({
      name: item.name,
      code: item.code,
    }));
    downloadCsv(csvData, 'grados');
  };

  return (
    <>
      <ResourceActionsToolbar
        onCreateClick={canCreate ? () => setIsCreateOpen(true) : undefined}
        onDeleteAll={
          canDeleteAll
            ? () => deleteAllDegreesAction(organizationId)
            : undefined
        }
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
          exportCsv: tCommon('exportCsv'),
        }}
        onExportCsv={handleExportCsv}
        appendModalContent={
          canImport ? (
            <DegreeBulkUploader organizationId={organizationId} mode="append" />
          ) : undefined
        }
        overwriteModalContent={
          canReplaceAll ? (
            <DegreeBulkUploader
              organizationId={organizationId}
              mode="overwrite"
            />
          ) : undefined
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
