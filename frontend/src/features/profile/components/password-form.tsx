'use client';

import { useTranslations } from 'next-intl';
import { endProfileSessionAction, updatePasswordAction } from '../actions';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/shared/form/form-input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UpdatePasswordBodySchema } from '@tfg-horarios/shared';
import { useActionForm } from '@/hooks/use-action-form';
import { z } from 'zod';

const PasswordFormSchema = UpdatePasswordBodySchema.extend({
  currentPassword: z.string().min(1),
  confirmPassword: z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Las contraseñas no coinciden',
});

type PasswordFormDTO = z.infer<typeof PasswordFormSchema>;

export function PasswordForm() {
  const t = useTranslations('Profile');

  const { form, state, isPending, handleSubmit } = useActionForm<
    PasswordFormDTO,
    void
  >({
    action: ({ currentPassword, newPassword }) =>
      updatePasswordAction({ currentPassword, newPassword }),
    schema: PasswordFormSchema,
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    onSuccess: () => {
      form.reset();
    },
  });

  const showSuccessDialog = state?.success === true;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          name="currentPassword"
          type="password"
          label={t('currentPassword')}
          disabled={isPending}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            name="newPassword"
            type="password"
            label={t('newPassword')}
            disabled={isPending}
          />

          <FormInput
            name="confirmPassword"
            type="password"
            label={t('confirmPassword')}
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-end pt-4 gap-4">
          {state?.success === false && state.message && (
            <span className="text-sm text-red-600 dark:text-red-400">
              {state.message || t('errorPassword')}
            </span>
          )}
          <Button
            type="submit"
            disabled={isPending || !form.formState.isValid}
            className="bg-neutral-800 text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {isPending ? t('updatingPassword') : t('updatePassword')}
          </Button>
        </div>

        <AlertDialog open={showSuccessDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Contraseña Actualizada</AlertDialogTitle>
              <AlertDialogDescription>
                La contraseña se ha actualizado correctamente. Por favor, vuelva
                a iniciar sesión con su nueva contraseña.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => endProfileSessionAction('/login')}
              >
                Aceptar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </Form>
  );
}
