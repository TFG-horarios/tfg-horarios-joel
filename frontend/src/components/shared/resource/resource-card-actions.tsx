'use client';

import { Pencil, Trash, Eye, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResourceDeleteAction } from './resource-delete-action';
import type { ReactNode } from 'react';
import type { ResourceDeleteHandler } from './resource-delete-action';

export interface ResourceCardActionsProps {
  onEdit?: () => void;
  onDelete?: ResourceDeleteHandler;
  onView?: () => void;
  itemName?: string;
  deleteTitle?: string;
  deleteDescription?: string;
  deleteLabel?: string;
  children?: ReactNode;
}

export function ResourceCardActions({
  onEdit,
  onDelete,
  onView,
  itemName,
  deleteTitle,
  deleteDescription,
  deleteLabel,
  children,
}: ResourceCardActionsProps) {
  const t = useTranslations('Common.actions');

  if (!onEdit && !onDelete && !onView && !children) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-full w-full rounded-xl bg-card border border-border shadow-sm text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {children}
        {onView && (
          <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            {t('open')}
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            {t('edit')}
          </DropdownMenuItem>
        )}
        {onDelete && (
          <ResourceDeleteAction
            onDelete={onDelete}
            itemName={itemName}
            deleteTitle={deleteTitle}
            deleteDescription={deleteDescription}
            deleteLabel={deleteLabel}
          >
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-destructive cursor-pointer"
            >
              <Trash className="mr-2 h-4 w-4" />
              {deleteLabel || t('delete')}
            </DropdownMenuItem>
          </ResourceDeleteAction>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
