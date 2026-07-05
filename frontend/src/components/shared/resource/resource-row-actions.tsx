'use client';

import { Pencil, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { useTranslations } from 'next-intl';
import { ResourceDeleteAction } from './resource-delete-action';
import type { ReactNode } from 'react';
import type { ResourceDeleteHandler } from './resource-delete-action';

export interface ResourceRowActionsProps {
  onEdit?: () => void;
  onDelete?: ResourceDeleteHandler;
  onView?: () => void;
  itemName?: string;
  deleteTitle?: string;
  deleteDescription?: string;
  children?: ReactNode;
}

export function ResourceRowActions({
  onEdit,
  onDelete,
  onView,
  itemName,
  deleteTitle,
  deleteDescription,
  children,
}: ResourceRowActionsProps) {
  const t = useTranslations('Common.actions');

  return (
    <TableCell className="text-right">
      <div className="flex items-center justify-end gap-2">
        {children}
        {onView && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onView}
            title={t('open')}
          >
            <Eye className="size-4" />
          </Button>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            title={t('edit')}
          >
            <Pencil className="size-4" />
          </Button>
        )}
        {onDelete && (
          <ResourceDeleteAction
            onDelete={onDelete}
            itemName={itemName}
            deleteTitle={deleteTitle}
            deleteDescription={deleteDescription}
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              title={t('delete')}
            >
              <Trash className="size-4" />
            </Button>
          </ResourceDeleteAction>
        )}
      </div>
    </TableCell>
  );
}
