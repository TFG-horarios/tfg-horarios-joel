'use client';

import React from 'react';
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

export interface ResourceCardActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  itemName?: string;
  deleteTitle?: string;
  deleteDescription?: string;
  children?: React.ReactNode;
}

export function ResourceCardActions({
  onEdit,
  onDelete,
  onView,
  itemName,
  deleteTitle,
  deleteDescription,
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
          className="h-8 w-8 absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
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
          >
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
            >
              <Trash className="mr-2 h-4 w-4" />
              {t('delete')}
            </DropdownMenuItem>
          </ResourceDeleteAction>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
