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

        const seenCodes = new Set<string>();
        const seenNames = new Set<string>();

        validData.forEach((row, idx) => {
          const codeLower = row.code.toLowerCase();
          const nameLower = row.name.toLowerCase();
          if (
            mode !== 'overwrite' &&
            existingCodes.has(codeLower)
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
            existingNames.has(nameLower)
          ) {
            issues.push({
              rowNumber: idx + 2,
              category: 'duplicate',
              severity: 'warning',
              column: 'name',
              providedValue: row.name,
              message: t('duplicateName', { name: row.name }),
            });
          } else if (seenCodes.has(codeLower)) {
            issues.push({
              rowNumber: idx + 2,
              category: 'duplicate',
              severity: 'warning',
              column: 'code',
              providedValue: row.code,
              message: t('duplicateCode', { code: row.code }),
            });
          } else if (seenNames.has(nameLower)) {
            issues.push({
              rowNumber: idx + 2,
              category: 'duplicate',
              severity: 'warning',
              column: 'name',
              providedValue: row.name,
              message: t('duplicateName', { name: row.name }),
            });
          } else {
            seenCodes.add(codeLower);
            seenNames.add(nameLower);
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
