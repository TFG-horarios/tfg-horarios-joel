'use client';

import { useTransition, type ReactNode, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTranslations } from 'next-intl';

export interface ResourceDeleteActionProps {
  onDelete: () => Promise<{ success: boolean; message?: string }> | void;
  itemName?: string;
  deleteTitle?: string;
  deleteDescription?: string;
  children: ReactNode;
}

export function ResourceDeleteAction({
  onDelete,
  itemName = 'este elemento',
  deleteTitle,
  deleteDescription,
  children,
}: ResourceDeleteActionProps) {
  const t = useTranslations('Common.actions');
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await onDelete();
      } catch (error) {
        console.error('Delete action failed', error);
      } finally {
        setIsOpen(false);
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {deleteTitle || `¿Eliminar ${itemName}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {deleteDescription ||
              `Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar permanentemente ${itemName}?`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? '...' : t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
