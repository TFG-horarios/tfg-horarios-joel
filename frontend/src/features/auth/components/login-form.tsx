'use client';

import { useActionState, startTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { LoginSchema, type LoginDTO } from '@tfg-horarios/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { loginAction } from '@/features/auth/actions';
import { cn } from '@/lib/utils';
import { useZodErrorMap } from '@/lib/i18n/zod-errors';

type ActionState = { success: boolean; message?: string } | null;

export function LoginForm() {
  const t = useTranslations('Auth.login');
  const tCommon = useTranslations('Common');
  const zodErrorMap = useZodErrorMap();

  const [state, formAction, isPending] = useActionState(
    async (prevState: ActionState, formData: LoginDTO) => {
      return await loginAction(formData);
    },
    null
  );

  const form = useForm<LoginDTO>({
    resolver: zodResolver(LoginSchema, {
      error: zodErrorMap,
    }),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(data: LoginDTO) {
    startTransition(() => {
      formAction(data);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t('fields.email.label')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={t('fields.email.placeholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              {fieldState.error && (
                <p className="text-xs font-medium text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t('fields.password.label')}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('fields.password.placeholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              {fieldState.error && (
                <p className="text-xs font-medium text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </FormItem>
          )}
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
