'use client';

import { useState } from 'react';
import { ResourceActionsToolbar } from '@/components/shared/resource/resource-actions-toolbar';
import { SubjectGroupBulkUploader } from '@/features/subject-group/components/subject-group-bulk-uploader';
import { SubjectGroupFormModal } from './subject-group-form-modal';
import type { SubjectDTO } from '@tfg-horarios/shared';
import { useTranslations } from 'next-intl';
import { deleteAllSubjectGroupsAction } from '@/features/subject-group/actions';

interface SubjectGroupActionsProps {
  organizationId: string;
  subjects: SubjectDTO[];
}

export function SubjectGroupActions({
  organizationId,
  subjects,
}: SubjectGroupActionsProps) {
  const t = useTranslations('Organizations.subjectGroups.actions');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      <ResourceActionsToolbar
        onCreateClick={() => setIsCreateOpen(true)}
        onDeleteAll={() => deleteAllSubjectGroupsAction(organizationId)}
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
          <SubjectGroupBulkUploader
            organizationId={organizationId}
            subjects={subjects}
            mode="append"
          />
        }
        overwriteModalContent={
          <SubjectGroupBulkUploader
            organizationId={organizationId}
            subjects={subjects}
            mode="overwrite"
          />
        }
      />
      <SubjectGroupFormModal
        organizationId={organizationId}
        subjects={subjects}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </>
  );
}
