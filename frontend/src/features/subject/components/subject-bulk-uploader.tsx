'use client';

import { z } from 'zod';
import { useTranslations } from 'next-intl';
import {
  type Shift,
  SaveSubjectBodySchema,
  type DegreeDTO,
  type ItineraryDTO,
} from '@tfg-horarios/shared';
import {
  bulkCreateSubjects,
  replaceSubjectsAction,
  fetchSubjectIdentifiersAction,
} from '@/features/subject/actions';
import {
  GenericBulkUploader,
  type CsvRowIssue,
} from '@/components/shared/generic-bulk-uploader';

const GlobalSubjectCsvSchema = SaveSubjectBodySchema.extend({
  degreeCode: z.string().min(1),
  itineraryCode: z.string().optional(),
});

type BulkSubjectDTO = z.infer<typeof GlobalSubjectCsvSchema>;

interface Props {
  organizationId: string;
  degrees: DegreeDTO[];
  itineraries: ItineraryDTO[];
  mode?: 'append' | 'overwrite';
  onBeforeUpload?: (
    mode: 'append' | 'overwrite' | undefined,
    validData: BulkSubjectDTO[]
  ) => Promise<void>;
}

export function SubjectBulkUploader({
  organizationId,
  degrees,
  itineraries,
  mode,
  onBeforeUpload,
}: Props) {
  const t = useTranslations('Common.bulkUploaders.subjects');
  const degreeMap = new Map(degrees.map((d) => [d.code.toLowerCase(), d.id]));
  const itineraryMap = new Map(
    itineraries.map((i) => [`${i.degreeId}-${i.code.toLowerCase()}`, i.id])
  );

  return (
    <GenericBulkUploader<BulkSubjectDTO>
      title={t('title')}
      description={t('description')}
      expectedColumns={[
        'degreeCode',
        'name',
        'code',
        'availableShifts',
        'courseYear',
        'weeklyHours',
        'numberOfStudents',
        'period',
        'isCommon',
        'itineraryCode',
      ]}
      schema={GlobalSubjectCsvSchema}
      rowTransformer={(row) => ({
        degreeCode: (row.degreeCode || '').trim().toUpperCase(),
        itineraryCode: (row.itineraryCode || '').trim(),
        name: (row.name || '').trim(),
        code: (row.code || '').trim().toUpperCase(),
        availableShifts: (row.availableShifts
          ? row.availableShifts.split(',').map((s) => s.trim().toLowerCase())
          : ['morning']) as Shift[],
        numberOfStudents: Number(row.numberOfStudents || 0),
        courseYear: Number(row.courseYear || 1),
        period: Number(row.period || 1),
        weeklyHours: Number(row.weeklyHours || 0),
        isCommon: String(row.isCommon).toLowerCase() === 'true',
      })}
      onAnalyze={async (validData) => {
        let currentIdentifiers: string[] = [];
        try {
          currentIdentifiers =
            await fetchSubjectIdentifiersAction(organizationId);
        } catch (error) {
          console.error('Failed to fetch existing subject identifiers', error);
        }
        const existingCodes = new Set(
          currentIdentifiers.map((code) => code.toLowerCase())
        );

        const issues: CsvRowIssue[] = [];
        const finalValidData: typeof validData = [];

        const seenCodes = new Set<string>();

        validData.forEach((row, idx) => {
          const degreeId = degreeMap.get(row.degreeCode.toLowerCase());
          let isRowValid = true;

          if (!degreeId) {
            issues.push({
              rowNumber: idx + 2,
              category: 'reference',
              severity: 'error',
              column: 'degreeCode',
              providedValue: row.degreeCode,
              message: t('missingDegree'),
            });
            isRowValid = false;
          } else if (!row.isCommon) {
            if (!row.itineraryCode) {
              issues.push({
                rowNumber: idx + 2,
                category: 'business',
                severity: 'error',
                column: 'itineraryCode',
                providedValue: '',
                message: t('missingItineraryCode'),
              });
              isRowValid = false;
            } else {
              const itId = itineraryMap.get(
                `${degreeId}-${row.itineraryCode.toLowerCase()}`
              );
              if (!itId) {
                issues.push({
                  rowNumber: idx + 2,
                  category: 'reference',
                  severity: 'error',
                  column: 'itineraryCode',
                  providedValue: row.itineraryCode,
                  message: t('missingItinerary'),
                });
                isRowValid = false;
              }
            }
          }

          if (isRowValid) {
            const codeLower = row.code.toLowerCase();
            if (mode !== 'overwrite' && existingCodes.has(codeLower)) {
              issues.push({
                rowNumber: idx + 2,
                category: 'duplicate',
                severity: 'warning',
                column: 'code',
                providedValue: row.code,
                message: t('duplicate'),
              });
            } else if (seenCodes.has(codeLower)) {
              issues.push({
                rowNumber: idx + 2,
                category: 'duplicate',
                severity: 'warning',
                column: 'code',
                providedValue: row.code,
                message: t('duplicate'),
              });
            } else {
              seenCodes.add(codeLower);
              finalValidData.push(row);
            }
          }
        });
        return { finalValidData, issues };
      }}
      mode={mode}
      onBeforeUpload={async (m, validData) => {
        if (onBeforeUpload) return onBeforeUpload(m, validData);
      }}
      onUpload={async (finalData) => {
        const dtos = finalData.map(
          ({ degreeCode, itineraryCode, ...subject }) => {
            const degreeId = degreeMap.get(degreeCode.toLowerCase())!;
            const itineraryId = subject.isCommon
              ? undefined
              : itineraryMap.get(`${degreeId}-${itineraryCode!.toLowerCase()}`);
            return {
              ...subject,
              degreeId,
              itineraryId,
            };
          }
        );

        let result;
        if (mode === 'overwrite') {
          result = await replaceSubjectsAction(organizationId, dtos);
        } else {
          result = await bulkCreateSubjects(organizationId, dtos);
        }

        if (!result.success) {
          throw new Error(result.message);
        }
      }}
    />
  );
}
