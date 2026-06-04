'use client';

import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { SaveItineraryBodySchema, type DegreeDTO } from '@tfg-horarios/shared';
import {
  bulkCreateItineraries,
  replaceItinerariesAction,
  getItineraryIdentifiersAction,
} from '@/features/itinerary/actions';
import {
  GenericBulkUploader,
  type CsvRowIssue,
} from '@/components/shared/generic-bulk-uploader';

const GlobalItineraryCsvSchema = SaveItineraryBodySchema.extend({
  degreeCode: z.string().min(1),
});

type BulkItineraryDTO = z.infer<typeof GlobalItineraryCsvSchema>;

interface ItineraryBulkUploaderProps {
  organizationId: string;
  degrees: DegreeDTO[];
  mode?: 'append' | 'overwrite';
  onBeforeUpload?: (
    mode: 'append' | 'overwrite' | undefined,
    validData: BulkItineraryDTO[]
  ) => Promise<void>;
}

export function ItineraryBulkUploader({
  organizationId,
  degrees,
  mode,
  onBeforeUpload,
}: ItineraryBulkUploaderProps) {
  const t = useTranslations('Common.bulkUploaders.itineraries');
  const degreeMap = new Map(degrees.map((d) => [d.code.toLowerCase(), d.id]));

  return (
    <GenericBulkUploader<BulkItineraryDTO>
      title={t('title')}
      description={t('description')}
      expectedColumns={['degreeCode', 'code', 'name']}
      schema={GlobalItineraryCsvSchema}
      rowTransformer={(row: Record<string, string>) => ({
        degreeCode: (row.degreeCode || '').trim().toUpperCase(),
        code: (row.code || '').trim().toUpperCase(),
        name: (row.name || '').trim(),
      })}
      onAnalyze={async (validData) => {
        let currentIdentifiers: string[] = [];
        try {
          currentIdentifiers =
            await getItineraryIdentifiersAction(organizationId);
        } catch (error) {
          console.error(
            'Failed to fetch existing itinerary identifiers',
            error
          );
        }
        const existingSet = new Set(
          currentIdentifiers.map((code) => code.toLowerCase())
        );

        const issues: CsvRowIssue[] = [];
        const finalValidData: typeof validData = [];

        const seenCodes = new Set<string>();

        validData.forEach((row, idx) => {
          const degreeId = degreeMap.get(row.degreeCode.toLowerCase());

          if (!degreeId) {
            issues.push({
              rowNumber: idx + 2,
              category: 'reference',
              severity: 'error',
              column: 'degreeCode',
              providedValue: row.degreeCode,
              message: t('missingDegree', { degreeCode: row.degreeCode }),
            });
            return;
          }

          const codeLower = row.code.toLowerCase();
          const isDuplicate =
            mode !== 'overwrite' && existingSet.has(codeLower);
          if (isDuplicate) {
            issues.push({
              rowNumber: idx + 2,
              category: 'duplicate',
              severity: 'warning',
              column: 'code',
              providedValue: row.code,
              message: t('duplicate', {
                code: row.code,
                degreeCode: row.degreeCode,
              }),
            });
          } else if (seenCodes.has(codeLower)) {
            issues.push({
              rowNumber: idx + 2,
              category: 'duplicate',
              severity: 'warning',
              column: 'code',
              providedValue: row.code,
              message: t('duplicate', {
                code: row.code,
                degreeCode: row.degreeCode,
              }),
            });
          } else {
            seenCodes.add(codeLower);
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
        const dtos = finalData.map(({ degreeCode, ...itinerary }) => {
          const id = degreeMap.get(degreeCode.toLowerCase())!;
          return {
            ...itinerary,
            degreeId: id,
          };
        });

        let result;
        if (mode === 'overwrite') {
          result = await replaceItinerariesAction(organizationId, dtos);
        } else {
          result = await bulkCreateItineraries(organizationId, dtos);
        }

        if (!result.success) {
          throw new Error(result.message);
        }
      }}
    />
  );
}
