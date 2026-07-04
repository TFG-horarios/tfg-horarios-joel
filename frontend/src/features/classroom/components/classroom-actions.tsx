'use client';

import { useState } from 'react';
import {
  ResourceActionsToolbar,
  useResourceActionsToolbarTranslations,
} from '@/components/shared/resource/resource-actions-toolbar';
import { ClassroomBulkUploader } from '@/features/classroom/components/classroom-bulk-uploader';
import {
  deleteAllClassroomsAction,
  fetchAllClassroomsAction,
} from '@/features/classroom/actions';
import { ClassroomFormModal } from './classroom-form-modal';
import { downloadCsv } from '@/lib/utils/csv';

interface ClassroomActionsProps {
  organizationId: string;
  canCreate?: boolean;
  canDeleteAll?: boolean;
  canImport?: boolean;
  canReplaceAll?: boolean;
}

export function ClassroomActions({
  organizationId,
  canCreate,
  canDeleteAll,
  canImport,
  canReplaceAll,
}: ClassroomActionsProps) {
  const translations = useResourceActionsToolbarTranslations(
    'Organizations.classrooms.actions'
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleExportCsv = async () => {
    const data = await fetchAllClassroomsAction(organizationId);
    const csvData = data.map((item) => ({
      name: item.name,
      capacity: item.capacity,
      type: item.type,
      floor: item.floor,
    }));
    downloadCsv(csvData, 'aulas');
  };

  return (
    <>
      <ResourceActionsToolbar
        onCreateClick={canCreate ? () => setIsCreateOpen(true) : undefined}
        onDeleteAll={
          canDeleteAll
            ? () => deleteAllClassroomsAction(organizationId)
            : undefined
        }
        translations={translations}
        onExportCsv={handleExportCsv}
        appendModalContent={
          canImport ? (
            <ClassroomBulkUploader
              organizationId={organizationId}
              mode="append"
            />
          ) : undefined
        }
        overwriteModalContent={
          canReplaceAll ? (
            <ClassroomBulkUploader
              organizationId={organizationId}
              mode="overwrite"
            />
          ) : undefined
        }
      />
      <ClassroomFormModal
        organizationId={organizationId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </>
  );
}
