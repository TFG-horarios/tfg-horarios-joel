'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/shared/form/form-input';
import {
  SaveDegreeBodySchema,
  type SaveDegreeDTO,
  type DegreeDTO,
} from '@tfg-horarios/shared';
import { useActionForm } from '@/hooks/use-action-form';
import type { ActionResponse } from '@/types/actions';

type DegreeFormProps = {
  action: (data: SaveDegreeDTO) => Promise<ActionResponse<DegreeDTO>>;
  defaultValues?: Partial<SaveDegreeDTO>;
  onSuccess?: (data?: DegreeDTO) => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
};

export function DegreeForm({
  action,
  defaultValues,
  onSuccess,
  submitLabel,
  cancelLabel,
  onCancel,
}: DegreeFormProps) {
  const t = useTranslations('Organizations.degrees.form');

  const { form, isPending, handleSubmit } = useActionForm<
    SaveDegreeDTO,
    DegreeDTO
  >({
    action,
    schema: SaveDegreeBodySchema,
    defaultValues: {
      name: defaultValues?.name ?? '',
      code: defaultValues?.code ?? '',
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
          name="code"
          label={t('code.label')}
          placeholder={t('code.placeholder')}
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
