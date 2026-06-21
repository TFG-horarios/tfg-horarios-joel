'use client';

import { useState } from 'react';
import { ResourceActionsToolbar } from '@/components/shared/resource/resource-actions-toolbar';
import { SubjectBulkUploader } from '@/features/subject/components/subject-bulk-uploader';
import type {
  DegreeDTO,
  ItineraryDTO,
  OrganizationDTO,
  AcademicYearDTO,
} from '@tfg-horarios/shared';
import { useTranslations } from 'next-intl';
import {
  deleteAllSubjectsAction,
  fetchAllSubjectsAction,
} from '@/features/subject/actions';
import { SubjectFormModal } from './subject-form-modal';
import { downloadCsv } from '@/lib/utils/csv';

interface SubjectActionsProps {
  organization: OrganizationDTO;
  academicYear: AcademicYearDTO;
  degrees: DegreeDTO[];
  itineraries: ItineraryDTO[];
  canCreate?: boolean;
  canDeleteAll?: boolean;
  canImport?: boolean;
  canReplaceAll?: boolean;
}

export function SubjectActions({
  organization,
  academicYear,
  degrees,
  itineraries,
  canCreate,
  canDeleteAll,
  canImport,
  canReplaceAll,
}: SubjectActionsProps) {
  const t = useTranslations('Organizations.subjects.actions');
  const tCommon = useTranslations('Common.actions');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleExportCsv = async () => {
    const data = await fetchAllSubjectsAction(organization.id);
    const degreeMap = new Map(degrees.map((d) => [d.id, d.code]));
    const itineraryMap = new Map(itineraries.map((i) => [i.id, i.code]));

    const csvData = data.map((item) => ({
      degreeCode: degreeMap.get(item.degreeId) || '',
      name: item.name,
      code: item.code,
      availableShifts: item.availableShifts.join(','),
      courseYear: item.courseYear,
      weeklyHours: item.weeklyHours,
      numberOfStudents: item.numberOfStudents,
      period: item.period,
      isCommon: item.isCommon ? 'true' : 'false',
      itineraryCode: item.itineraryId
        ? itineraryMap.get(item.itineraryId) || ''
        : '',
    }));
    downloadCsv(csvData, 'asignaturas');
  };

  return (
    <>
      <ResourceActionsToolbar
        onCreateClick={canCreate ? () => setIsCreateOpen(true) : undefined}
        onDeleteAll={
          canDeleteAll
            ? () => deleteAllSubjectsAction(organization.id)
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
            <SubjectBulkUploader
              organizationId={organization.id}
              degrees={degrees}
              itineraries={itineraries}
              mode="append"
            />
          ) : undefined
        }
        overwriteModalContent={
          canReplaceAll ? (
            <SubjectBulkUploader
              organizationId={organization.id}
              degrees={degrees}
              itineraries={itineraries}
              mode="overwrite"
            />
          ) : undefined
        }
      />
      <SubjectFormModal
        organization={organization}
        academicYear={academicYear}
        degrees={degrees}
        itineraries={itineraries}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </>
  );
}
