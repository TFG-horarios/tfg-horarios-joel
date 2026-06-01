'use client';

import { useTranslations } from 'next-intl';
import {
  SaveDegreeBodySchema,
  type DegreeDTO,
  type SaveDegreeDTO,
} from '@tfg-horarios/shared';
import {
  bulkCreateDegrees,
  replaceDegreesAction,
} from '@/features/degree/actions';
import {
  GenericBulkUploader,
  type CsvRowIssue,
} from '@/components/shared/generic-bulk-uploader';

interface DegreeBulkUploaderProps {
  organizationId: string;
  existingDegrees: DegreeDTO[];
  mode?: 'append' | 'overwrite';
  onBeforeUpload?: (
    mode: 'append' | 'overwrite' | undefined,
    validData: SaveDegreeDTO[]
  ) => Promise<void>;
}

export function DegreeBulkUploader({
  organizationId,
  existingDegrees,
  mode,
  onBeforeUpload,
}: DegreeBulkUploaderProps) {
  const t = useTranslations('Common.bulkUploaders.degrees');
  const existingCodes = new Set(
    existingDegrees.map((d) => d.code.toLowerCase())
  );
  const existingNames = new Set(
    existingDegrees.map((d) => d.name.toLowerCase())
  );

  return (
    <GenericBulkUploader<SaveDegreeDTO>
      title={t('title')}
      description={t('description')}
      expectedColumns={['name', 'code']}
      schema={SaveDegreeBodySchema}
      rowTransformer={(row) => ({
        name: (row.name || '').trim(),
        code: (row.code || '').trim().toUpperCase(),
      })}
      onAnalyze={async (validData) => {
        const issues: CsvRowIssue[] = [];
        const finalValidData: typeof validData = [];

        validData.forEach((row, idx) => {
          if (
            mode !== 'overwrite' &&
            existingCodes.has(row.code.toLowerCase())
          ) {
            issues.push({
              rowNumber: idx + 2,
              category: 'duplicate',
              severity: 'warning',
              column: 'code',
              providedValue: row.code,
              message: t('duplicateCode', { code: row.code }),
            });
          } else if (
            mode !== 'overwrite' &&
            existingNames.has(row.name.toLowerCase())
          ) {
            issues.push({
              rowNumber: idx + 2,
              category: 'duplicate',
              severity: 'warning',
              column: 'name',
              providedValue: row.name,
              message: t('duplicateName', { name: row.name }),
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
      }}
      onUpload={async (finalData) => {
        if (mode === 'overwrite') {
          await replaceDegreesAction(organizationId, finalData);
        } else {
          await bulkCreateDegrees(organizationId, finalData);
        }
      }}
    />
  );
}
