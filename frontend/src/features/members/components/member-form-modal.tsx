'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MemberForm, type MemberFormDTO } from './member-form';
import { addMemberAction, updateMemberRoleAction } from '../actions';
import type { MemberDTO } from '@tfg-horarios/shared';
import { toast } from 'sonner';

interface MemberFormModalProps {
  organizationId: string;
  member?: MemberDTO;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MemberFormModal({
  organizationId,
  member,
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: MemberFormModalProps) {
  const t = useTranslations('Organizations.members');
  const tCommon = useTranslations('Common.actions');
  const tCommonErrors = useTranslations('Common.errors');
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setIsOpen = isControlled
    ? setControlledOpen || (() => {})
    : setUncontrolledOpen;

  const isEditing = !!member;

  const handleAction = async (data: MemberFormDTO) => {
    if (isEditing) {
      return updateMemberRoleAction(organizationId, member.id, {
        role: data.role,
      });
    } else {
      if (!data.email) {
        const message = tCommonErrors('emailRequired');
        return {
          success: false as const,
          message,
          errors: { email: [message] },
        };
      }
      return addMemberAction(organizationId, {
        email: data.email,
        role: data.role,
      });
    }
  };

  const handleSuccess = () => {
    setIsOpen(false);
    toast.success(isEditing ? t('messages.updated') : t('messages.created'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('actions.edit') : t('actions.create')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? t('actions.edit') : t('actions.create')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <MemberForm
            action={handleAction}
            isEditing={isEditing}
            memberEmail={member?.userEmail}
            defaultValues={member ? { role: member.role } : undefined}
            onSuccess={handleSuccess}
            submitLabel={isEditing ? tCommon('saveChanges') : tCommon('create')}
            cancelLabel={tCommon('cancel')}
            onCancel={() => setIsOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
