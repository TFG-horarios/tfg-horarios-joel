'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/shared/form/form-input';
import { FormSelect } from '@/components/shared/form/form-select';
import { FormMultiSelect } from '@/components/shared/form/form-multi-select';
import { FormCheckbox } from '@/components/shared/form/form-checkbox';
import {
  SaveSubjectBodySchema,
  type SubjectDTO,
  type DegreeDTO,
  type ItineraryDTO,
} from '@tfg-horarios/shared';
import { useActionForm } from '@/hooks/use-action-form';
import type { ActionResponse } from '@/types/actions';
import { z } from 'zod';
import { useWatch } from 'react-hook-form';
import { useEffect } from 'react';

export const SubjectFormSchema = SaveSubjectBodySchema.extend({
  degreeId: z.string().uuid().optional(),
});
export type SubjectFormDTO = z.infer<typeof SubjectFormSchema>;

type SubjectFormProps = {
  periodType: 'annual' | 'semester' | 'trimester';
  action: (data: SubjectFormDTO) => Promise<ActionResponse<SubjectDTO>>;
  defaultValues?: Partial<SubjectFormDTO>;
  degrees: DegreeDTO[];
  itineraries: ItineraryDTO[];
  isEditing: boolean;
  onSuccess?: (data?: SubjectDTO) => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
};

export function SubjectForm({
  periodType,
  action,
  defaultValues,
  degrees,
  itineraries,
  isEditing,
  onSuccess,
  submitLabel,
  cancelLabel,
  onCancel,
}: SubjectFormProps) {
  const t = useTranslations('Organizations.subjects.form');

  const { form, state, isPending, handleSubmit } = useActionForm<
    SubjectFormDTO,
    SubjectDTO
  >({
    action,
    schema: SubjectFormSchema,
    defaultValues: {
      name: defaultValues?.name ?? '',
      code: defaultValues?.code ?? '',
      degreeId: defaultValues?.degreeId ?? '',
      itineraryId: defaultValues?.itineraryId ?? undefined,
      availableShifts: defaultValues?.availableShifts ?? ['morning'],
      numberOfStudents: defaultValues?.numberOfStudents ?? 0,
      courseYear: defaultValues?.courseYear ?? 1,
      period: defaultValues?.period ?? 1,
      weeklyHours: defaultValues?.weeklyHours ?? 0,
      isCommon: defaultValues?.isCommon ?? true,
    },
    onSuccess,
  });

  const selectedDegreeId = useWatch({
    control: form.control,
    name: 'degreeId',
  });
  const isCommon = useWatch({ control: form.control, name: 'isCommon' });
  const currentItineraryId = useWatch({
    control: form.control,
    name: 'itineraryId',
  });

  useEffect(() => {
    if (selectedDegreeId && currentItineraryId) {
      const itineraryExistsInDegree = itineraries.some(
        (i) => i.id === currentItineraryId && i.degreeId === selectedDegreeId
      );
      if (!itineraryExistsInDegree) {
        form.setValue('itineraryId', undefined, { shouldValidate: true });
      }
    }
  }, [selectedDegreeId, currentItineraryId, itineraries, form]);

  const filteredItineraries = itineraries.filter(
    (i) => i.degreeId === selectedDegreeId
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEditing && (
          <FormSelect
            name="degreeId"
            label={t('degreeId.label')}
            placeholder={t('degreeId.placeholder')}
            options={degrees.map((d) => ({
              label: `${d.name} (${d.code})`,
              value: d.id,
            }))}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            name="name"
            label={t('name.label')}
            placeholder={t('name.placeholder')}
          />
          <FormInput
            name="code"
            label={t('code.label')}
            placeholder={t('code.placeholder')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormMultiSelect
            name="availableShifts"
            label={t('availableShifts.label')}
            options={[
              { label: 'Mañana', value: 'morning' },
              { label: 'Tarde', value: 'afternoon' },
            ]}
          />
          <FormInput
            name="numberOfStudents"
            type="number"
            label={t('numberOfStudents.label')}
            placeholder={t('numberOfStudents.placeholder')}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormSelect
            name="courseYear"
            label={t('courseYear.label')}
            placeholder={t('courseYear.placeholder')}
            options={[1, 2, 3, 4].map((c) => ({
              label: `${c}º`,
              value: c.toString(),
            }))}
          />
          <FormSelect
            name="period"
            label={t('period.label')}
            placeholder={t('period.placeholder')}
            options={
              periodType === 'annual'
                ? [{ label: 'Anual', value: '0' }]
                : periodType === 'semester'
                  ? [
                      { label: '1º Semestre', value: '0' },
                      { label: '2º Semestre', value: '1' },
                    ]
                  : [
                      { label: '1º Trimestre', value: '0' },
                      { label: '2º Trimestre', value: '1' },
                      { label: '3º Trimestre', value: '2' },
                    ]
            }
          />
          <FormInput
            name="weeklyHours"
            type="number"
            label={t('weeklyHours.label')}
            placeholder={t('weeklyHours.placeholder')}
          />
        </div>

        <div className="space-y-4">
          <FormCheckbox name="isCommon" label={t('isCommon.label')} />

          {!isCommon && (
            <FormSelect
              name="itineraryId"
              label={t('itineraryId.label')}
              placeholder={t('itineraryId.placeholder')}
              options={filteredItineraries.map((i) => ({
                label: `${i.name} (${i.code})`,
                value: i.id,
              }))}
            />
          )}
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
