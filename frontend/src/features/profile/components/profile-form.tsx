'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { updateProfileNameAction } from '../actions';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/providers/session-provider';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/shared/form/form-input';
import { Input } from '@/components/ui/input';
import {
  SaveUserBodySchema,
  type SaveUserDTO,
  type UserDTO,
} from '@tfg-horarios/shared';
import { useActionForm } from '@/hooks/use-action-form';

export function ProfileForm({
  user,
}: {
  user: { name: string; email: string };
}) {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common.actions');
  const router = useRouter();

  const { updateSessionData } = useSession();

  const { form, state, isPending, handleSubmit } = useActionForm<
    SaveUserDTO,
    UserDTO
  >({
    action: updateProfileNameAction,
    schema: SaveUserBodySchema,
    defaultValues: {
      name: user.name,
    },
    onSuccess: (updatedUser) => {
      const name = updatedUser?.name ?? form.getValues('name');
      updateSessionData({ name });
      form.reset({ name });
      router.refresh();
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('email')}</label>
          <Input type="email" value={user.email} disabled />
          <p className="text-xs text-muted-foreground">
            {t('emailDescription')}
          </p>
        </div>

        <FormInput
          name="name"
          label={t('name')}
          placeholder={t('namePlaceholder')}
          disabled={isPending}
        />

        <div className="flex items-center justify-end pt-4">
          <div className="flex items-center gap-4">
            {state?.success === false && state.message && (
              <span className="text-sm text-red-600 dark:text-red-400">
                {state.message || tCommon('genericError')}
              </span>
            )}
            {state?.success && (
              <span className="text-sm text-green-600 dark:text-green-400">
                {t('successName')}
              </span>
            )}
            <Button
              type="submit"
              disabled={
                isPending || !form.formState.isDirty || !form.formState.isValid
              }
              className="bg-brand-purple-solid text-white hover:bg-brand-purple-solid/90"
            >
              {isPending ? tCommon('saving') : tCommon('saveChanges')}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
