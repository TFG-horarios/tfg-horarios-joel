'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/shared/form/form-input';
import { FormSelect } from '@/components/shared/form/form-select';
import {
  SaveSubjectGroupBodySchema,
  type SubjectGroupDTO,
  type SubjectDTO,
} from '@tfg-horarios/shared';
import { useActionForm } from '@/hooks/use-action-form';
import type { ActionResponse } from '@/types/actions';
import { z } from 'zod';

export const SubjectGroupFormSchema = SaveSubjectGroupBodySchema.extend({
  subjectId: z.string().uuid().optional(),
});
export type SubjectGroupFormDTO = z.infer<typeof SubjectGroupFormSchema>;

type SubjectGroupFormProps = {
  action: (
    data: SubjectGroupFormDTO
  ) => Promise<ActionResponse<SubjectGroupDTO>>;
  defaultValues?: Partial<SubjectGroupFormDTO>;
  subjects: SubjectDTO[];
  isEditing: boolean;
  onSuccess?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
};

export function SubjectGroupForm({
  action,
  defaultValues,
  subjects,
  isEditing,
  onSuccess,
  submitLabel,
  cancelLabel,
  onCancel,
}: SubjectGroupFormProps) {
  const t = useTranslations('Organizations.subjectGroups.form');
  const tGroup = useTranslations('Organizations.subjectGroups');

  const { form, state, isPending, handleSubmit } = useActionForm<
    SubjectGroupFormDTO,
    SubjectGroupDTO
  >({
    action,
    schema: SubjectGroupFormSchema,
    defaultValues: {
      name: defaultValues?.name ?? '',
      subjectId: defaultValues?.subjectId,
      groupType: defaultValues?.groupType ?? 'theory',
      shift: defaultValues?.shift ?? 'morning',
      groupNumber: defaultValues?.groupNumber ?? 1,
      weeklyHours: defaultValues?.weeklyHours ?? 2.5,
      numberOfStudents: defaultValues?.numberOfStudents ?? 0,
    },
    onSuccess,
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEditing && (
          <FormSelect
            name="subjectId"
            label={t('subjectId.label')}
            placeholder={t('subjectId.placeholder')}
            options={subjects.map((subject) => ({
              label: subject.name,
              value: subject.id,
            }))}
          />
        )}

        <FormInput
          name="name"
          label={t('name.label')}
          placeholder={t('name.placeholder')}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            name="groupType"
            label={t('groupType.label')}
            placeholder={t('groupType.placeholder')}
            options={[
              { label: tGroup('typeOptions.theory'), value: 'theory' },
              { label: tGroup('typeOptions.problems'), value: 'problems' },
              { label: tGroup('typeOptions.practices'), value: 'practices' },
            ]}
          />
          <FormSelect
            name="shift"
            label={t('shift.label')}
            placeholder={t('shift.placeholder')}
            options={[
              { label: tGroup('shiftOptions.morning'), value: 'morning' },
              { label: tGroup('shiftOptions.afternoon'), value: 'afternoon' },
            ]}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormInput
            name="groupNumber"
            type="number"
            label={t('groupNumber.label')}
            placeholder={t('groupNumber.placeholder')}
          />
          <FormInput
            name="weeklyHours"
            type="number"
            step="0.1"
            label={t('weeklyHours.label')}
            placeholder={t('weeklyHours.placeholder')}
          />
          <FormInput
            name="numberOfStudents"
            type="number"
            label={t('numberOfStudents.label')}
            placeholder={t('numberOfStudents.placeholder')}
          />
        </div>

        {state?.success === false && state.message && (
          <div className="text-sm font-medium text-destructive">
            {state.message}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              {cancelLabel || 'Cancelar'}
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? '...' : submitLabel || 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
