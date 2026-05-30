'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/shared/form/form-input';
import { FormSelect } from '@/components/shared/form/form-select';
import {
  SaveOrganizationBodySchema,
  type SaveOrganizationDTO,
  type OrganizationDTO,
} from '@tfg-horarios/shared';
import { createOrganizationAction } from '../actions';
import { useActionForm } from '@/hooks/use-action-form';

type CreateOrganizationFormProps = {
  onSuccess?: () => void;
};

export function CreateOrganizationForm({
  onSuccess,
}: CreateOrganizationFormProps) {
  const t = useTranslations('Organizations.form');

  const { form, state, isPending, handleSubmit } = useActionForm<
    SaveOrganizationDTO,
    OrganizationDTO
  >({
    action: createOrganizationAction,
    schema: SaveOrganizationBodySchema,
    defaultValues: {
      name: '',
      periodType: 'semester',
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '14:00',
      afternoonEnd: '20:00',
      slotDurationMinutes: 60,
    },
    onSuccess: () => onSuccess?.(),
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormInput
          name="name"
          label={t('name.label')}
          placeholder={t('name.placeholder')}
        />

        <FormSelect
          name="periodType"
          label={t('periodType.label')}
          placeholder={t('periodType.placeholder')}
          options={[
            { label: t('periodType.options.semester'), value: 'semester' },
            { label: t('periodType.options.trimester'), value: 'trimester' },
            { label: t('periodType.options.annual'), value: 'annual' },
          ]}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormInput
            name="morningStart"
            type="time"
            label={t('morningStart.label')}
            placeholder={t('morningStart.placeholder')}
          />
          <FormInput
            name="morningEnd"
            type="time"
            label={t('morningEnd.label')}
            placeholder={t('morningEnd.placeholder')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormInput
            name="afternoonStart"
            type="time"
            label={t('afternoonStart.label')}
            placeholder={t('afternoonStart.placeholder')}
          />
          <FormInput
            name="afternoonEnd"
            type="time"
            label={t('afternoonEnd.label')}
            placeholder={t('afternoonEnd.placeholder')}
          />
        </div>

        <FormInput
          name="slotDurationMinutes"
          type="number"
          min="15"
          max="240"
          step="15"
          label={t('slotDurationMinutes.label')}
          placeholder={t('slotDurationMinutes.placeholder')}
          helpText={t('slotDurationMinutes.help')}
          onChange={(e) =>
            form.setValue('slotDurationMinutes', e.target.valueAsNumber || 0)
          }
        />

        {state?.success === false && (
          <div
            aria-live="polite"
            className="rounded-lg border px-3 py-2 text-sm text-destructive border-destructive/50 bg-destructive/10"
          >
            {state.message}
          </div>
        )}

        <Button type="submit" className="w-full h-10" disabled={isPending}>
          {isPending ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Form>
  );
}
