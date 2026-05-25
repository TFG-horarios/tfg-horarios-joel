'use client';

import { useTranslations } from 'next-intl';
import {
  SaveClassroomBodySchema,
  type ClassroomDTO,
  type SaveClassroomDTO,
} from '@tfg-horarios/shared';
import { bulkCreateClassrooms } from '@/features/classroom/actions';
import {
  GenericBulkUploader,
  type CsvRowIssue,
} from '@/components/shared/generic-bulk-uploader';

interface ClassroomBulkUploaderProps {
  organizationId: string;
  existingClassrooms: ClassroomDTO[];
  mode?: 'append' | 'overwrite';
  onBeforeUpload?: (
    mode: 'append' | 'overwrite' | undefined,
    validData: SaveClassroomDTO[]
  ) => Promise<void>;
}

export function ClassroomBulkUploader({
  organizationId,
  existingClassrooms,
  mode,
  onBeforeUpload,
}: ClassroomBulkUploaderProps) {
  const t = useTranslations('Common.bulkUploaders.classrooms');
  const existingNames = new Set(
    existingClassrooms.map((c) => c.name.toLowerCase())
  );

  return (
    <GenericBulkUploader<SaveClassroomDTO>
      title={t('title')}
      description={t('description')}
      expectedColumns={['name', 'capacity', 'type']}
      schema={SaveClassroomBodySchema}
      rowTransformer={(row) => ({
        name: (row.name || '').trim(),
        capacity: Number(row.capacity || 0),
        type: (row.type || 'theory').trim().toLowerCase() as 'theory' | 'lab',
      })}
      onAnalyze={async (validData) => {
        const issues: CsvRowIssue[] = [];
        const finalValidData: typeof validData = [];

        validData.forEach((row, idx) => {
          if (existingNames.has(row.name.toLowerCase())) {
            issues.push({
              rowNumber: idx + 2,
              category: 'duplicate',
              severity: 'warning',
              column: 'name',
              providedValue: row.name,
              message: t('duplicate', { name: row.name }),
            });
          } else {
            finalValidData.push(row);
          }
        });

        return { finalValidData, issues };
      }}
      mode={mode}
      onBeforeUpload={async (m, validData) => {
        if (onBeforeUpload) return onBeforeUpload(m, validData);
        if (m === 'overwrite') {
          try {
            await fetch(`/api/organizations/${organizationId}/classrooms`, {
              method: 'DELETE',
            });
          } catch (err) {
            console.error('Error deleting classrooms before overwrite', err);
          }
        }
      }}
      onUpload={async (finalData) => {
        await bulkCreateClassrooms(organizationId, finalData);
      }}
    />
  );
}
