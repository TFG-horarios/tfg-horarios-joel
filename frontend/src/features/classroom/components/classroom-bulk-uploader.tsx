'use client';

import { useTranslations } from 'next-intl';
import {
  SaveClassroomBodySchema,
  type SaveClassroomDTO,
} from '@tfg-horarios/shared';
import {
  bulkCreateClassrooms,
  replaceClassroomsAction,
  fetchClassroomIdentifiersAction,
} from '@/features/classroom/actions';
import {
  GenericBulkUploader,
  type CsvRowIssue,
} from '@/components/shared/generic-bulk-uploader';

interface ClassroomBulkUploaderProps {
  organizationId: string;
  mode?: 'append' | 'overwrite';
  onBeforeUpload?: (
    mode: 'append' | 'overwrite' | undefined,
    validData: SaveClassroomDTO[]
  ) => Promise<void>;
}

export function ClassroomBulkUploader({
  organizationId,
  mode,
  onBeforeUpload,
}: ClassroomBulkUploaderProps) {
  const t = useTranslations('Common.bulkUploaders.classrooms');

  return (
    <GenericBulkUploader<SaveClassroomDTO>
      title={t('title')}
      description={t('description')}
      expectedColumns={['name', 'capacity', 'floor', 'type']}
      schema={SaveClassroomBodySchema}
      rowTransformer={(row) => ({
        name: (row.name || '').trim(),
        capacity: Number(row.capacity || 0),
        floor: Number(row.floor || 0),
        type: (row.type || 'theory').trim().toLowerCase() as 'theory' | 'lab',
      })}
      onAnalyze={async (validData) => {
        const issues: CsvRowIssue[] = [];
        const finalValidData: typeof validData = [];

        const identifiers =
          await fetchClassroomIdentifiersAction(organizationId);
        const existingNames = new Set(
          identifiers.map((name) => name.toLowerCase())
        );

        const seenNames = new Set<string>();

        validData.forEach((row, idx) => {
          const nameLower = row.name.toLowerCase();
          if (mode !== 'overwrite' && existingNames.has(nameLower)) {
            issues.push({
              rowNumber: idx + 2,
              category: 'duplicate',
              severity: 'warning',
              column: 'name',
              providedValue: row.name,
              message: t('duplicate', { name: row.name }),
            });
          } else if (seenNames.has(nameLower)) {
            issues.push({
              rowNumber: idx + 2,
              category: 'duplicate',
              severity: 'warning',
              column: 'name',
              providedValue: row.name,
              message: t('duplicate', { name: row.name }),
            });
          } else {
            seenNames.add(nameLower);
            finalValidData.push(row);
          }
        });

        return { finalValidData, issues };
      }}
      mode={mode}
      onBeforeUpload={onBeforeUpload}
      onUpload={async (finalData) => {
        let result;
        if (mode === 'overwrite') {
          result = await replaceClassroomsAction(organizationId, finalData);
        } else {
          result = await bulkCreateClassrooms(organizationId, finalData);
        }

        if (!result.success) {
          throw new Error(result.message);
        }
      }}
    />
  );
}
