'use client';

import { useState } from 'react';

import {
  ResourceActionsToolbar,
  useResourceActionsToolbarTranslations,
} from '@/components/shared/resource/resource-actions-toolbar';
import { ItineraryBulkUploader } from '@/features/itinerary/components/itinerary-bulk-uploader';
import type { DegreeDTO } from '@tfg-horarios/shared';
import {
  deleteAllItinerariesAction,
  fetchAllItinerariesAction,
} from '@/features/itinerary/actions';
import { ItineraryFormModal } from './itinerary-form-modal';
import { downloadCsv } from '@/lib/utils/csv';

interface ItineraryActionsProps {
  organizationId: string;
  degrees: DegreeDTO[];
  canCreate?: boolean;
  canDeleteAll?: boolean;
  canImport?: boolean;
  canReplaceAll?: boolean;
}

export function ItineraryActions({
  organizationId,
  degrees,
  canCreate,
  canDeleteAll,
  canImport,
  canReplaceAll,
}: ItineraryActionsProps) {
  const translations = useResourceActionsToolbarTranslations(
    'Organizations.itineraries.actions'
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleExportCsv = async () => {
    const data = await fetchAllItinerariesAction(organizationId);
    const degreeMap = new Map(degrees.map((d) => [d.id, d.code]));

    const csvData = data.map((item) => ({
      degreeCode: item.degreeId ? degreeMap.get(item.degreeId) || '' : '',
      code: item.code,
      name: item.name,
    }));
    downloadCsv(csvData, 'itinerarios');
  };

  return (
    <>
      <ResourceActionsToolbar
        onCreateClick={canCreate ? () => setIsCreateOpen(true) : undefined}
        onDeleteAll={
          canDeleteAll
            ? () => deleteAllItinerariesAction(organizationId)
            : undefined
        }
        translations={translations}
        onExportCsv={handleExportCsv}
        appendModalContent={
          canImport ? (
            <ItineraryBulkUploader
              organizationId={organizationId}
              degrees={degrees}
              mode="append"
            />
          ) : undefined
        }
        overwriteModalContent={
          canReplaceAll ? (
            <ItineraryBulkUploader
              organizationId={organizationId}
              degrees={degrees}
              mode="overwrite"
            />
          ) : undefined
        }
      />
      <ItineraryFormModal
        organizationId={organizationId}
        degrees={degrees}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </>
  );
}
