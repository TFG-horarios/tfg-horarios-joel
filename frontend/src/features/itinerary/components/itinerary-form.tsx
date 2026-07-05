'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/shared/form/form-input';
import { FormSelect } from '@/components/shared/form/form-select';
import {
  SaveItineraryBodySchema,
  type ItineraryDTO,
  type DegreeDTO,
} from '@tfg-horarios/shared';
import { useActionForm } from '@/hooks/use-action-form';
import type { ActionResponse } from '@/types/actions';
import { z } from 'zod';

export const ItineraryFormSchema = SaveItineraryBodySchema.extend({
  degreeId: z.string().uuid(),
});
export type ItineraryFormDTO = z.infer<typeof ItineraryFormSchema>;

type ItineraryFormProps = {
  action: (data: ItineraryFormDTO) => Promise<ActionResponse<ItineraryDTO>>;
  defaultValues?: Partial<ItineraryFormDTO>;
  degrees: DegreeDTO[];
  isEditing: boolean;
  onSuccess?: (data?: ItineraryDTO) => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
};

export function ItineraryForm({
  action,
  defaultValues,
  degrees,
  isEditing,
  onSuccess,
  submitLabel,
  cancelLabel,
  onCancel,
}: ItineraryFormProps) {
  const t = useTranslations('Organizations.itineraries.form');

  const { form, state, isPending, handleSubmit } = useActionForm<
    ItineraryFormDTO,
    ItineraryDTO
  >({
    action,
    schema: ItineraryFormSchema,
    defaultValues: {
      name: defaultValues?.name ?? '',
      code: defaultValues?.code ?? '',
      degreeId: defaultValues?.degreeId ?? '',
    },
    onSuccess,
  });

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
            searchable={true}
            searchPlaceholder={t('degreeId.placeholder')}
          />
        )}

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
