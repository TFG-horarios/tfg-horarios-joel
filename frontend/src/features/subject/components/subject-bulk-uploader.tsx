'use client';

import { z } from 'zod';
import { useTranslations } from 'next-intl';
import {
  SaveSubjectBodySchema,
  type DegreeDTO,
  type SubjectDTO,
  type ItineraryDTO,
} from '@tfg-horarios/shared';
import {
  bulkCreateSubjects,
  replaceSubjectsAction,
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
  existingSubjects: SubjectDTO[];
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
  existingSubjects,
  itineraries,
  mode,
  onBeforeUpload,
}: Props) {
  const t = useTranslations('Common.bulkUploaders.subjects');
  const degreeMap = new Map(degrees.map((d) => [d.code.toLowerCase(), d.id]));
  const existingCodes = new Set(
    existingSubjects.map((s) => s.code.toLowerCase())
  );
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
          : ['morning']) as ('morning' | 'afternoon')[],
        numberOfStudents: Number(row.numberOfStudents || 0),
        courseYear: Number(row.courseYear || 1),
        period: Number(row.period || 1),
        weeklyHours: Number(row.weeklyHours || 0),
        isCommon: String(row.isCommon).toLowerCase() === 'true',
      })}
      onAnalyze={async (validData) => {
        const issues: CsvRowIssue[] = [];
        const finalValidData: typeof validData = [];

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
                message: t('duplicate'),
              });
            } else {
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

        if (mode === 'overwrite') {
          await replaceSubjectsAction(organizationId, dtos);
        } else {
          await bulkCreateSubjects(organizationId, dtos);
        }
      }}
    />
  );
}
