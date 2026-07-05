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

export type ResourceDeleteResult = {
  success: boolean;
  message?: string;
};

export type ResourceDeleteHandler = () =>
  | Promise<ResourceDeleteResult | void>
  | ResourceDeleteResult
  | void;

export interface ResourceDeleteActionProps {
  onDelete: ResourceDeleteHandler;
  itemName?: string;
  deleteTitle?: string;
  deleteDescription?: string;
  deleteLabel?: string;
  children: ReactNode;
}

export function ResourceDeleteAction({
  onDelete,
  itemName = 'este elemento',
  deleteTitle,
  deleteDescription,
  deleteLabel,
  children,
}: ResourceDeleteActionProps) {
  const t = useTranslations('Common.actions');
  const statusT = useTranslations('Common.status');
  const errorT = useTranslations('Common.errors');
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await onDelete();
        if (result && result.success === false) {
          setError(result.message || errorT('delete'));
          return;
        }
        setIsOpen(false);
      } catch (error) {
        console.error('Delete action failed', error);
        setError(errorT('delete'));
      }
    });
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setError(null);
        }
      }}
    >
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
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
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
            {isPending ? statusT('deleting') : deleteLabel || t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
