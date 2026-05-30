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
  const subjectMap = new Map(subjects.map((s) => [s.code.toLowerCase(), s]));
  const existingSet = new Map(
    existingGroups.map((g) => [`${g.subjectId}-${g.name.toLowerCase()}`, g])
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
        let finalValidData: typeof validData = [];

        validData.forEach((row, idx) => {
          const subject = subjectMap.get(row.subjectCode.toLowerCase());
          if (!subject) {
            issues.push({
              rowNumber: idx + 2,
              category: 'reference',
              severity: 'error',
              column: 'subjectCode',
              providedValue: row.subjectCode,
              message: t('missingSubject'),
            });
          } else if (!subject.availableShifts.includes(row.shift)) {
            issues.push({
              rowNumber: idx + 2,
              category: 'validation',
              severity: 'error',
              column: 'shift',
              providedValue: row.shift,
              message: 'Turno no disponible para esta asignatura',
            });
          } else if (
            existingSet.has(`${subject.id}-${row.name.toLowerCase()}`)
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

        const hoursBySubjectShift = new Map<
          string,
          {
            theory: number;
            practices: number;
            problems: number;
            rows: number[];
          }
        >();

        if (mode !== 'overwrite') {
          existingGroups.forEach((g) => {
            const key = `${g.subjectId}|${g.shift}`;
            if (!hoursBySubjectShift.has(key)) {
              hoursBySubjectShift.set(key, {
                theory: 0,
                practices: 0,
                problems: 0,
                rows: [],
              });
            }
            const data = hoursBySubjectShift.get(key)!;
            if (g.groupType === 'theory')
              data.theory = Math.max(data.theory, g.weeklyHours);
            if (g.groupType === 'practices')
              data.practices = Math.max(data.practices, g.weeklyHours);
            if (g.groupType === 'problems')
              data.problems = Math.max(data.problems, g.weeklyHours);
          });
        }

        finalValidData.forEach((row) => {
          const subject = subjectMap.get(row.subjectCode.toLowerCase())!;
          const key = `${subject.id}|${row.shift}`;
          if (!hoursBySubjectShift.has(key)) {
            hoursBySubjectShift.set(key, {
              theory: 0,
              practices: 0,
              problems: 0,
              rows: [],
            });
          }
          const data = hoursBySubjectShift.get(key)!;
          const originalIdx = validData.indexOf(row);
          data.rows.push(originalIdx + 2);

          if (row.groupType === 'theory')
            data.theory = Math.max(data.theory, row.weeklyHours);
          if (row.groupType === 'practices')
            data.practices = Math.max(data.practices, row.weeklyHours);
          if (row.groupType === 'problems')
            data.problems = Math.max(data.problems, row.weeklyHours);
        });

        for (const [key, data] of hoursBySubjectShift.entries()) {
          const subjectId = key.split('|')[0];
          const subject = subjects.find((s) => s.id === subjectId)!;
          const totalCalculated = data.theory + data.practices + data.problems;

          if (totalCalculated !== subject.weeklyHours) {
            data.rows.forEach((rowNumber) => {
              issues.push({
                rowNumber,
                category: 'validation',
                severity: 'error',
                column: 'weeklyHours',
                providedValue: totalCalculated.toString(),
                message: `Las horas de los grupos (${totalCalculated}) no coinciden con la asignatura (${subject.weeklyHours})`,
              });
            });
            finalValidData = finalValidData.filter((r) => {
              const origIdx = validData.indexOf(r) + 2;
              return !data.rows.includes(origIdx);
            });
          }
        }

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
          const subject = subjectMap.get(subjectCode.toLowerCase())!;
          if (!groups.has(subject.id)) groups.set(subject.id, []);
          groups.get(subject.id)!.push(dto);
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
