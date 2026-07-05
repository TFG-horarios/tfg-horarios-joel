'use client';

import { useTranslations } from 'next-intl';
import { RegisterSchema, type RegisterDTO } from '@tfg-horarios/shared';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/shared/form/form-input';
import { registerAction } from '@/features/auth/actions';
import { cn } from '@/lib/utils/styles';
import { useActionForm } from '@/hooks/use-action-form';

export function RegisterForm() {
  const t = useTranslations('Auth.register');
  const tCommon = useTranslations('Common');

  const { form, state, isPending, handleSubmit } = useActionForm<
    RegisterDTO,
    void
  >({
    action: registerAction,
    schema: RegisterSchema,
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          name="name"
          type="text"
          label={t('fields.name.label')}
          placeholder={t('fields.name.placeholder')}
          autoComplete="name"
        />

        <FormInput
          name="email"
          type="email"
          label={t('fields.email.label')}
          placeholder={t('fields.email.placeholder')}
          autoComplete="email"
        />

        <FormInput
          name="password"
          type="password"
          label={t('fields.password.label')}
          placeholder={t('fields.password.placeholder')}
          autoComplete="new-password"
        />

        <FormInput
          name="confirmPassword"
          type="password"
          label={t('fields.confirmPassword.label')}
          placeholder={t('fields.confirmPassword.placeholder')}
          autoComplete="new-password"
        />

        {state ? (
          <div
            aria-live="polite"
            className={cn(
              'rounded-lg border px-3 py-2 text-sm',
              state.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300'
            )}
          >
            {state.message}
          </div>
        ) : null}

        <Button type="submit" className="h-10 w-full" disabled={isPending}>
          {isPending ? tCommon('status.loading') : t('submit')}
        </Button>
      </form>
    </Form>
  );
}
