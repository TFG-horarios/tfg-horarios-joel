'use client';

import { startTransition, useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { RegisterSchema, type RegisterDTO } from '@tfg-horarios/shared';
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
import { registerAction } from '@/features/auth/actions';
import { cn } from '@/lib/utils';
import { useZodErrorMap } from '@/lib/i18n/zod-errors';

type ActionState = { success: boolean; message?: string } | null;

export function RegisterForm() {
  const t = useTranslations('Auth.register');
  const tCommon = useTranslations('Common');
  const zodErrorMap = useZodErrorMap();

  const [state, formAction, isPending] = useActionState(
    async (prevState: ActionState, formData: RegisterDTO) => {
      return await registerAction(formData);
    },
    null
  );

  const form = useForm<RegisterDTO>({
    resolver: zodResolver(RegisterSchema, {
      error: zodErrorMap,
    }),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  function onSubmit(data: RegisterDTO) {
    startTransition(() => {
      formAction(data);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t('fields.name.label')}</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  autoComplete="name"
                  placeholder={t('fields.name.placeholder')}
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
                  autoComplete="new-password"
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
