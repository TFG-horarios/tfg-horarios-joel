'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/shared/form/form-input';
import { FormSelect } from '@/components/shared/form/form-select';
import {
  SaveClassroomBodySchema,
  type SaveClassroomDTO,
  type ClassroomDTO,
} from '@tfg-horarios/shared';
import { useActionForm } from '@/hooks/use-action-form';
import type { ActionResponse } from '@/types/actions';

type ClassroomFormProps = {
  action: (data: SaveClassroomDTO) => Promise<ActionResponse<ClassroomDTO>>;
  defaultValues?: Partial<SaveClassroomDTO>;
  onSuccess?: (data?: ClassroomDTO) => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
};

export function ClassroomForm({
  action,
  defaultValues,
  onSuccess,
  submitLabel,
  cancelLabel,
  onCancel,
}: ClassroomFormProps) {
  const t = useTranslations('Organizations.classrooms.form');

  const { form, isPending, handleSubmit } = useActionForm<
    SaveClassroomDTO,
    ClassroomDTO
  >({
    action,
    schema: SaveClassroomBodySchema,
    defaultValues: {
      name: defaultValues?.name ?? '',
      capacity: defaultValues?.capacity ?? 0,
      floor: defaultValues?.floor ?? 0,
      type: defaultValues?.type ?? 'theory',
    },
    onSuccess,
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          name="name"
          label={t('name.label')}
          placeholder={t('name.placeholder')}
        />

        <FormInput
          name="capacity"
          type="number"
          min="1"
          label={t('capacity.label')}
          placeholder={t('capacity.placeholder')}
        />

        <FormInput
          name="floor"
          type="number"
          step="1"
          label={t('floor.label')}
          placeholder={t('floor.placeholder')}
        />

        <FormSelect
          name="type"
          label={t('type.label')}
          placeholder={t('type.placeholder')}
          options={[
            { label: t('typeOptions.theory'), value: 'theory' },
            { label: t('typeOptions.lab'), value: 'lab' },
          ]}
        />

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
