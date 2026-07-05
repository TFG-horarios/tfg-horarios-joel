'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { UserDTO } from '@tfg-horarios/shared';
import { LanguageToggle } from '@/components/i18n/language-toggle';
import { ResourceDeleteAction } from '@/components/shared/resource/resource-delete-action';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { PasswordForm } from './password-form';
import { ProfileForm } from './profile-form';
import { deleteAccountAction, endProfileSessionAction } from '../actions';

export function ProfilePageClient({ user }: { user: UserDTO }) {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common.actions');
  const router = useRouter();
  const [showDeleteSuccessDialog, setShowDeleteSuccessDialog] = useState(false);

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 size-4" />
            {tCommon('back')}
          </Button>
        </div>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('description')}</p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('general')}</h2>
          <div className="rounded-xl border border-black/10 bg-white/50 p-6 dark:border-white/10 dark:bg-white/5">
            <ProfileForm user={user} />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Interfaz de Usuario</h2>
          <div className="rounded-xl border border-black/10 bg-white/50 p-6 dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{t('theme')}</span>
                <ThemeToggle />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{t('language')}</span>
                <LanguageToggle />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">{t('security')}</h2>
          <div className="space-y-6">
            <div className="rounded-xl border border-black/10 bg-white/50 p-6 dark:border-white/10 dark:bg-white/5">
              <PasswordForm />
            </div>

            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 dark:border-red-500/30 dark:bg-red-500/10">
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
                {t('deleteAccount')}
              </h3>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
                {t('deleteAccountDescription')}
              </p>
              <ResourceDeleteAction
                deleteTitle={t('deleteAccountConfirm')}
                deleteDescription={t('deleteAccountWarning')}
                onDelete={async () => {
                  const res = await deleteAccountAction();
                  if (res.success) {
                    setShowDeleteSuccessDialog(true);
                    return { success: true };
                  }

                  toast.error(res.message, {
                    duration: 8000,
                  });
                  return { success: false, message: res.message };
                }}
              >
                <Button variant="destructive">
                  {t('deleteAccountButton')}
                </Button>
              </ResourceDeleteAction>
            </div>
          </div>
        </section>
      </div>

      <AlertDialog
        open={showDeleteSuccessDialog}
        onOpenChange={setShowDeleteSuccessDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cuenta Eliminada</AlertDialogTitle>
            <AlertDialogDescription>
              Tu cuenta ha sido eliminada correctamente. Serás redirigido a la
              página principal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => endProfileSessionAction('/')}>
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
