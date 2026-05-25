'use client';

import { z } from 'zod';
import { useTranslations } from 'next-intl';
import {
  SaveItineraryBodySchema,
  type DegreeDTO,
  type ItineraryDTO,
} from '@tfg-horarios/shared';
import { bulkCreateItineraries } from '@/features/itinerary/actions';
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
  existingItineraries: ItineraryDTO[];
  mode?: 'append' | 'overwrite';
  onBeforeUpload?: (
    mode: 'append' | 'overwrite' | undefined,
    validData: BulkItineraryDTO[]
  ) => Promise<void>;
}

export function ItineraryBulkUploader({
  organizationId,
  degrees,
  existingItineraries,
  mode,
  onBeforeUpload,
}: ItineraryBulkUploaderProps) {
  const t = useTranslations('Common.bulkUploaders.itineraries');
  const degreeMap = new Map(degrees.map((d) => [d.code.toLowerCase(), d.id]));

  const existingSet = new Set(
    existingItineraries.map((i) => `${i.degreeId}-${i.code.toLowerCase()}`)
  );

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
        const issues: CsvRowIssue[] = [];
        const finalValidData: typeof validData = [];

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

          const isDuplicate = existingSet.has(
            `${degreeId}-${row.code.toLowerCase()}`
          );
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
            await fetch(`/api/organizations/${organizationId}/itineraries`, {
              method: 'DELETE',
            });
          } catch (err) {
            console.error('Error deleting itineraries before overwrite', err);
          }
        }
      }}
      onUpload={async (finalData) => {
        const groups = new Map<
          string,
          z.infer<typeof SaveItineraryBodySchema>[]
        >();

        finalData.forEach(({ degreeCode, ...itinerary }) => {
          const id = degreeMap.get(degreeCode.toLowerCase())!;
          if (!groups.has(id)) {
            groups.set(id, []);
          }
          groups.get(id)!.push(itinerary);
        });

        await Promise.all(
          Array.from(groups.entries()).map(([dId, items]) =>
            bulkCreateItineraries(organizationId, dId, items)
          )
        );
      }}
    />
  );
}
