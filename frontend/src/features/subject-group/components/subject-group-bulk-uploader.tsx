'use client';

import { z } from 'zod';
import { useTranslations } from 'next-intl';
import {
  SaveSubjectGroupBodySchema,
  type SubjectDTO,
} from '@tfg-horarios/shared';
import {
  bulkCreateSubjectGroups,
  replaceSubjectGroupsAction,
  getSubjectGroupIdentifiersAction,
} from '@/features/subject-group/actions';
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
  mode?: 'append' | 'overwrite';
  onBeforeUpload?: (
    mode: 'append' | 'overwrite' | undefined,
    validData: BulkSubjectGroupDTO[]
  ) => Promise<void>;
}

export function SubjectGroupBulkUploader({
  organizationId,
  subjects,
  mode,
  onBeforeUpload,
}: Props) {
  const t = useTranslations('Common.bulkUploaders.subjectGroups');
  const subjectMap = new Map(subjects.map((s) => [s.code.toLowerCase(), s]));

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
        let currentIdentifiers: {
          subjectId: string;
          shift: string;
          groupType: string;
          weeklyHours: number;
          groupNumber: number;
        }[];
        try {
          currentIdentifiers =
            await getSubjectGroupIdentifiersAction(organizationId);
        } catch (error) {
          console.error('Error fetching identifiers:', error);
          return { finalValidData: [], issues: [] };
        }

        const existingLogicalKeys = new Set(
          currentIdentifiers.map(
            (g) => `${g.subjectId}-${g.groupType}-${g.groupNumber}-${g.shift}`
          )
        );

        const issues: CsvRowIssue[] = [];
        let finalValidData: typeof validData = [];

        const seenLogicalKeys = new Set<string>();

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
            mode !== 'overwrite' &&
            existingLogicalKeys.has(
              `${subject.id}-${row.groupType}-${row.groupNumber}-${row.shift}`
            )
          ) {
            issues.push({
              rowNumber: idx + 2,
              category: 'duplicate',
              severity: 'warning',
              column: 'groupNumber',
              providedValue: row.groupNumber.toString(),
              message:
                'Ya existe un grupo con esta configuración (tipo, número y turno) para esta asignatura',
            });
          } else {
            const logicalKey = `${subject.id}-${row.groupType}-${row.groupNumber}-${row.shift}`;

            if (seenLogicalKeys.has(logicalKey)) {
              issues.push({
                rowNumber: idx + 2,
                category: 'duplicate',
                severity: 'warning',
                column: 'groupNumber',
                providedValue: row.groupNumber.toString(),
                message:
                  'Ya existe un grupo con esta configuración (tipo, número y turno) en el archivo',
              });
            } else {
              seenLogicalKeys.add(logicalKey);
              finalValidData.push(row);
            }
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
          currentIdentifiers.forEach((g) => {
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
      }}
      onUpload={async (finalData) => {
        const dtos = finalData.map(({ subjectCode, ...dto }) => {
          const subject = subjectMap.get(subjectCode.toLowerCase())!;
          return {
            ...dto,
            subjectId: subject.id,
          };
        });

        if (mode === 'overwrite') {
          await replaceSubjectGroupsAction(organizationId, dtos);
        } else {
          await bulkCreateSubjectGroups(organizationId, dtos);
        }
      }}
    />
  );
}
