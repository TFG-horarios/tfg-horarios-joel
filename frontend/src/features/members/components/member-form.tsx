'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/shared/form/form-input';
import { FormSelect } from '@/components/shared/form/form-select';
import { type MemberDTO } from '@tfg-horarios/shared';
import { useActionForm } from '@/hooks/use-action-form';
import type { ActionResponse } from '@/types/actions';
import { z } from 'zod';

export const MemberFormSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['admin', 'editor', 'viewer']),
});
export type MemberFormDTO = z.infer<typeof MemberFormSchema>;

type MemberFormProps = {
  action: (data: MemberFormDTO) => Promise<ActionResponse<MemberDTO | void>>;
  defaultValues?: Partial<MemberFormDTO>;
  isEditing: boolean;
  memberEmail?: string;
  onSuccess?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
};

export function MemberForm({
  action,
  defaultValues,
  isEditing,
  memberEmail,
  onSuccess,
  submitLabel,
  cancelLabel,
  onCancel,
}: MemberFormProps) {
  const t = useTranslations('Organizations.members.form');

  const { form, state, isPending, handleSubmit } = useActionForm<
    MemberFormDTO,
    MemberDTO | void
  >({
    action,
    schema: MemberFormSchema,
    defaultValues: {
      email: isEditing ? undefined : (defaultValues?.email ?? ''),
      role: defaultValues?.role ?? 'viewer',
    },
    onSuccess,
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isEditing ? (
          <div className="space-y-1 p-3 bg-muted rounded-md mb-4">
            <p className="text-sm font-medium text-muted-foreground">
              {t('email.label')}
            </p>
            <p className="font-medium">{memberEmail}</p>
          </div>
        ) : (
          <FormInput
            name="email"
            type="email"
            label={t('email.label')}
            placeholder={t('email.placeholder')}
          />
        )}

        <FormSelect
          name="role"
          label={t('role.label')}
          placeholder={t('role.placeholder')}
          options={[
            { label: 'Administrador', value: 'admin' },
            { label: 'Editor', value: 'editor' },
            { label: 'Lector', value: 'viewer' },
          ]}
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
