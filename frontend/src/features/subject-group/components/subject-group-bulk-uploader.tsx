'use client';

import { z } from 'zod';
import { useTranslations } from 'next-intl';
import {
  SaveSubjectGroupBodySchema,
  type SubjectDTO,
  type SubjectGroupDTO,
} from '@tfg-horarios/shared';
import { bulkCreateSubjectGroups } from '@/features/subject-group/actions';
import {
  GenericBulkUploader,
  type CsvRowIssue,
} from '@/components/shared/generic-bulk-uploader';

const GlobalSubjectGroupCsvSchema = SaveSubjectGroupBodySchema.extend({
  subjectCode: z.string().min(1),
});

type BulkSubjectGroupDTO = z.infer<typeof GlobalSubjectGroupCsvSchema>;

interface Props {
  organizationId: string;
  subjects: SubjectDTO[];
  existingGroups: SubjectGroupDTO[];
  mode?: 'append' | 'overwrite';
  onBeforeUpload?: (
    mode: 'append' | 'overwrite' | undefined,
    validData: BulkSubjectGroupDTO[]
  ) => Promise<void>;
}

export function SubjectGroupBulkUploader({
  organizationId,
  subjects,
  existingGroups,
  mode,
  onBeforeUpload,
}: Props) {
  const t = useTranslations('Common.bulkUploaders.subjectGroups');
  const subjectMap = new Map(subjects.map((s) => [s.code.toLowerCase(), s.id]));
  const existingSet = new Set(
    existingGroups.map((g) => `${g.subjectId}-${g.name.toLowerCase()}`)
  );

  return (
    <GenericBulkUploader<BulkSubjectGroupDTO>
      title={t('title')}
      description={t('description')}
      expectedColumns={[
        'subjectCode',
        'name',
        'numberOfStudents',
        'weeklyHours',
        'groupType',
        'shift',
        'groupNumber',
      ]}
      schema={GlobalSubjectGroupCsvSchema}
      rowTransformer={(row) => ({
        subjectCode: (row.subjectCode || '').trim().toUpperCase(),
        name: (row.name || '').trim(),
        groupType: (row.groupType || 'theory').trim().toLowerCase() as
          | 'theory'
          | 'problems'
          | 'practices',
        shift: (row.shift || 'morning').trim().toLowerCase() as
          | 'morning'
          | 'afternoon',
        numberOfStudents: Number(row.numberOfStudents || 0),
        weeklyHours: Number(row.weeklyHours || 0),
        groupNumber: Number(row.groupNumber || 1),
      })}
      onAnalyze={async (validData) => {
        const issues: CsvRowIssue[] = [];
        const finalValidData: typeof validData = [];

        validData.forEach((row, idx) => {
          const subjectId = subjectMap.get(row.subjectCode.toLowerCase());
          if (!subjectId) {
            issues.push({
              rowNumber: idx + 2,
              category: 'reference',
              severity: 'error',
              column: 'subjectCode',
              providedValue: row.subjectCode,
              message: t('missingSubject'),
            });
          } else if (
            existingSet.has(`${subjectId}-${row.name.toLowerCase()}`)
          ) {
            issues.push({
              rowNumber: idx + 2,
              category: 'duplicate',
              severity: 'warning',
              column: 'name',
              providedValue: row.name,
              message: t('duplicate'),
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
            await fetch(`/api/organizations/${organizationId}/subject-groups`, {
              method: 'DELETE',
            });
          } catch (err) {
            console.error(
              'Error deleting subject groups before overwrite',
              err
            );
          }
        }
      }}
      onUpload={async (finalData) => {
        const groups = new Map<
          string,
          z.infer<typeof SaveSubjectGroupBodySchema>[]
        >();
        finalData.forEach(({ subjectCode, ...dto }) => {
          const subjectId = subjectMap.get(subjectCode.toLowerCase())!;
          if (!groups.has(subjectId)) groups.set(subjectId, []);
          groups.get(subjectId)!.push(dto);
        });
        await Promise.all(
          Array.from(groups.entries()).map(([subId, dtos]) =>
            bulkCreateSubjectGroups(organizationId, subId, dtos)
          )
        );
      }}
    />
  );
}
