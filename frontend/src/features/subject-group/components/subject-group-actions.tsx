'use client';

import { useState } from 'react';
import {
  ResourceActionsToolbar,
  useResourceActionsToolbarTranslations,
} from '@/components/shared/resource/resource-actions-toolbar';
import { SubjectGroupBulkUploader } from '@/features/subject-group/components/subject-group-bulk-uploader';
import { SubjectGroupFormModal } from './subject-group-form-modal';
import type { SubjectDTO } from '@tfg-horarios/shared';
import {
  deleteAllSubjectGroupsAction,
  fetchAllSubjectGroupsAction,
} from '@/features/subject-group/actions';
import { downloadCsv } from '@/lib/utils/csv';

interface SubjectGroupActionsProps {
  organizationId: string;
  subjects: SubjectDTO[];
  canCreate?: boolean;
  canDeleteAll?: boolean;
  canImport?: boolean;
  canReplaceAll?: boolean;
}

export function SubjectGroupActions({
  organizationId,
  subjects,
  canCreate,
  canDeleteAll,
  canImport,
  canReplaceAll,
}: SubjectGroupActionsProps) {
  const translations = useResourceActionsToolbarTranslations(
    'Organizations.subjectGroups.actions'
  );
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
        onCreateClick={canCreate ? () => setIsCreateOpen(true) : undefined}
        onDeleteAll={
          canDeleteAll
            ? () => deleteAllSubjectGroupsAction(organizationId)
            : undefined
        }
        translations={translations}
        onExportCsv={handleExportCsv}
        appendModalContent={
          canImport ? (
            <SubjectGroupBulkUploader
              organizationId={organizationId}
              subjects={subjects}
              mode="append"
            />
          ) : undefined
        }
        overwriteModalContent={
          canReplaceAll ? (
            <SubjectGroupBulkUploader
              organizationId={organizationId}
              subjects={subjects}
              mode="overwrite"
            />
          ) : undefined
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
