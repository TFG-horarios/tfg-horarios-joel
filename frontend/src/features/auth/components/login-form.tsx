'use client';

import { useTranslations } from 'next-intl';
import { LoginSchema, type LoginDTO } from '@tfg-horarios/shared';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/shared/form/form-input';
import { loginAction } from '@/features/auth/actions';
import { cn } from '@/lib/utils/styles';
import { useActionForm } from '@/hooks/use-action-form';

export function LoginForm() {
  const t = useTranslations('Auth.login');
  const tCommon = useTranslations('Common');

  const { form, state, isPending, handleSubmit } = useActionForm<
    LoginDTO,
    void
  >({
    action: loginAction,
    schema: LoginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          autoComplete="current-password"
        />

        {state?.success === false ? (
          <div
            aria-live="polite"
            className={cn(
              'rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300'
            )}
          >
            {state.message || t('error')}
          </div>
        ) : null}

        <Button type="submit" className="h-10 w-full" disabled={isPending}>
          {isPending ? tCommon('status.loading') : t('submit')}
        </Button>
      </form>
    </Form>
  );
}
