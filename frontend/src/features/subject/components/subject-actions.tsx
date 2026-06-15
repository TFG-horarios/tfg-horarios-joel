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
import { deleteAllSubjectsAction } from '@/features/subject/actions';
import { SubjectFormModal } from './subject-form-modal';

interface SubjectActionsProps {
  organization: OrganizationDTO;
  academicYear: AcademicYearDTO;
  degrees: DegreeDTO[];
  itineraries: ItineraryDTO[];
}

export function SubjectActions({
  organization,
  academicYear,
  degrees,
  itineraries,
}: SubjectActionsProps) {
  const t = useTranslations('Organizations.subjects.actions');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      <ResourceActionsToolbar
        onCreateClick={() => setIsCreateOpen(true)}
        onDeleteAll={() => deleteAllSubjectsAction(organization.id)}
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
          <SubjectBulkUploader
            organizationId={organization.id}
            degrees={degrees}
            itineraries={itineraries}
            mode="append"
          />
        }
        overwriteModalContent={
          <SubjectBulkUploader
            organizationId={organization.id}
            degrees={degrees}
            itineraries={itineraries}
            mode="overwrite"
          />
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
