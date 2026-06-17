'use client';

import { useState } from 'react';
import { ResourceActionsToolbar } from '@/components/shared/resource/resource-actions-toolbar';
import { SubjectGroupBulkUploader } from '@/features/subject-group/components/subject-group-bulk-uploader';
import { SubjectGroupFormModal } from './subject-group-form-modal';
import type { SubjectDTO } from '@tfg-horarios/shared';
import { useTranslations } from 'next-intl';
import {
  deleteAllSubjectGroupsAction,
  fetchAllSubjectGroupsAction,
} from '@/features/subject-group/actions';
import { downloadCsv } from '@/lib/utils/csv';

interface SubjectGroupActionsProps {
  organizationId: string;
  subjects: SubjectDTO[];
}

export function SubjectGroupActions({
  organizationId,
  subjects,
}: SubjectGroupActionsProps) {
  const t = useTranslations('Organizations.subjectGroups.actions');
  const tCommon = useTranslations('Common.actions');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleExportCsv = async () => {
    const data = await fetchAllSubjectGroupsAction(organizationId);
    const subjectMap = new Map(subjects.map((s) => [s.id, s.code]));

    const csvData = data.map((item) => ({
      subjectCode: subjectMap.get(item.subjectId) || '',
      name: item.name,
      numberOfStudents: item.numberOfStudents,
      weeklyHours: item.weeklyHours,
      groupType: item.groupType,
      shift: item.shift,
      groupNumber: item.groupNumber,
    }));
    downloadCsv(csvData, 'grupos');
  };

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
          exportCsv: tCommon('exportCsv'),
        }}
        onExportCsv={handleExportCsv}
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
