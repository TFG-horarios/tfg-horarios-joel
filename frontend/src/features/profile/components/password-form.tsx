'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { endProfileSessionAction, updatePasswordAction } from '../actions';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function PasswordForm() {
  const t = useTranslations('Profile');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const showMatchError = confirmPassword.length > 0 && !passwordsMatch;

  const isValid = currentPassword && newPassword.length >= 8 && passwordsMatch;

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    const res = await updatePasswordAction({ currentPassword, newPassword });
    if (res.success) {
      setShowSuccessDialog(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setErrorMsg(res.message || t('errorPassword'));
    }

    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('currentPassword')}</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple-border"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('newPassword')}</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple-border"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('confirmPassword')}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
              showMatchError
                ? 'border-red-500/50 focus:ring-red-500/40'
                : 'border-border focus:ring-brand-purple-border'
            }`}
          />
          {showMatchError && (
            <p className="text-xs text-red-500 dark:text-red-400">
              {t('passwordsMismatch')}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end pt-4 gap-4">
        {errorMsg && (
          <span className="text-sm text-red-600 dark:text-red-400">
            {errorMsg}
          </span>
        )}
        {successMsg && (
          <span className="text-sm text-green-600 dark:text-green-400">
            {successMsg}
          </span>
        )}
        <Button
          onClick={handleSave}
          disabled={!isValid || isSaving}
          className="bg-neutral-800 text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          {isSaving ? t('updatingPassword') : t('updatePassword')}
        </Button>
      </div>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Contraseña Actualizada</AlertDialogTitle>
            <AlertDialogDescription>
              La contraseña se ha actualizado correctamente. Por favor, vuelva a
              iniciar sesión con su nueva contraseña.
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
    </div>
  );
}
