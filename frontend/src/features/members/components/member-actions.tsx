'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ResourceActions } from '@/components/shared/resource/resource-actions';
import { addMemberAction } from '@/features/members/actions';
import type { MemberDTO } from '@tfg-horarios/shared';

interface MemberActionsProps {
  organizationId: string;
  canManage: boolean;
}

export function MemberActions({
  organizationId,
  canManage,
}: MemberActionsProps) {
  const router = useRouter();
  const t = useTranslations('Organizations.membersManagement');
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newMemberRole, setNewMemberRole] =
    useState<MemberDTO['role']>('viewer');
  const [error, setError] = useState<string | null>(null);

  if (!canManage) return null;

  const submitAddMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();

    if (!email) {
      setError(t('message.invalidEmail'));
      return;
    }

    setIsAdding(true);
    try {
      const result = await addMemberAction(organizationId, {
        email,
        role: newMemberRole,
      });
      if (!result.success) throw new Error(result.message);
      setIsOpen(false);
      setNewMemberRole('viewer');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('message.addFailed'));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <ResourceActions>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  className="size-9 cursor-pointer"
                  aria-label={t('addTitle')}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">{t('addTitle')}</span>
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>{t('addTitle')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('addTitle')}</DialogTitle>
            <DialogDescription>
              Introduce el correo del nuevo miembro y asígnale un rol.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitAddMember} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{t('roleLabel')}</Label>
              <Select
                value={newMemberRole}
                onValueChange={(value) =>
                  setNewMemberRole(value as MemberDTO['role'])
                }
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder={t('rolePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    {t('roleOptions.admin')}
                  </SelectItem>
                  <SelectItem value="editor">
                    {t('roleOptions.editor')}
                  </SelectItem>
                  <SelectItem value="viewer">
                    {t('roleOptions.viewer')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('adding')}
                  </>
                ) : (
                  t('addButton')
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </ResourceActions>
  );
}
