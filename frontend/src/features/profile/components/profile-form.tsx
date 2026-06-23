'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { updateProfileNameAction } from '../actions';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/providers/session-provider';

export function ProfileForm({
  user,
}: {
  user: { name: string; email: string };
}) {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common.actions');
  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const { updateSessionData } = useSession();

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    const res = await updateProfileNameAction(name);
    if (res.success) {
      setSuccessMsg(t('successName'));
      updateSessionData({ name });
      router.refresh();
    } else {
      setErrorMsg(res.message || tCommon('genericError') || 'Error');
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('email')}</label>
        <input
          type="email"
          value={user.email}
          disabled
          className="flex h-10 w-full rounded-md border border-border bg-black/5 px-3 py-2 text-sm text-muted-foreground dark:bg-white/5 cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">{t('emailDescription')}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t('name')}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple-border"
        />
      </div>

      <div className="flex items-center justify-end pt-4">
        <div className="flex items-center gap-4">
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
            disabled={isSaving || name === user.name || name.trim().length < 2}
            className="bg-brand-purple-solid text-white hover:bg-brand-purple-solid/90"
          >
            {isSaving ? tCommon('saving') : tCommon('saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  );
}
