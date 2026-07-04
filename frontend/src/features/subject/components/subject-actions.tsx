'use client';

import { useState } from 'react';
import {
  ResourceActionsToolbar,
  useResourceActionsToolbarTranslations,
} from '@/components/shared/resource/resource-actions-toolbar';
import { SubjectBulkUploader } from '@/features/subject/components/subject-bulk-uploader';
import type {
  DegreeDTO,
  ItineraryDTO,
  OrganizationDTO,
  AcademicYearDTO,
} from '@tfg-horarios/shared';
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
  const translations = useResourceActionsToolbarTranslations(
    'Organizations.subjects.actions'
  );
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
        translations={translations}
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
