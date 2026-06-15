'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/shared/form/form-input';
import {
  SaveOrganizationBodySchema,
  type SaveOrganizationDTO,
  type OrganizationDTO,
} from '@tfg-horarios/shared';
import { createOrganizationAction, updateOrganizationAction } from '../actions';
import { useActionForm } from '@/hooks/use-action-form';

type OrganizationFormProps = {
  organization?: OrganizationDTO;
  onSuccess?: () => void;
};

export function OrganizationForm({
  organization,
  onSuccess,
}: OrganizationFormProps) {
  const t = useTranslations('Organizations.form');

  const { form, state, isPending, handleSubmit } = useActionForm<
    SaveOrganizationDTO,
    OrganizationDTO
  >({
    action: organization
      ? updateOrganizationAction.bind(null, organization.id)
      : createOrganizationAction,
    schema: SaveOrganizationBodySchema,
    defaultValues: organization
      ? {
          name: organization.name,
        }
      : {
          name: '',
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
