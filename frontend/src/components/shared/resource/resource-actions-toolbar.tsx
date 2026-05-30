'use client';

import { useState } from 'react';
import { Trash2, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ResourceActions } from '@/components/shared/resource/resource-actions';

export interface ResourceActionsToolbarProps {
  /*onDeleteAll: () => Promise<{ success: boolean; message?: string }>;*/
  appendModalContent: React.ReactNode;
  overwriteModalContent: React.ReactNode;
  onCreateClick?: () => void;
  translations: {
    deleteAllConfirm: string;
    deleteAllTitle: string;
    deleteAllDescription: string;
    deleting: string;
    cancel: string;
    import: string;
    addFromCsv: string;
    replaceAll: string;
    replaceAllWarning: string;
    create: string;
  };
}

export function ResourceActionsToolbar({
  /*onDeleteAll,*/
  appendModalContent,
  overwriteModalContent,
  onCreateClick,
  translations,
}: ResourceActionsToolbarProps) {
  // const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*const handleDeleteAll = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      const result = await onDeleteAll();
      if (!result.success && result.message) {
        setError(result.message);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };*/

  return (
    <ResourceActions>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-9 cursor-pointer text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            title={translations.deleteAllConfirm}
            aria-label={translations.deleteAllConfirm}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">{translations.deleteAllConfirm}</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.deleteAllTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.deleteAllDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
            {/* <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteAll();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting
                ? translations.deleting
                : translations.deleteAllConfirm}
            </AlertDialogAction> */}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-9 cursor-pointer"
            title={translations.import}
            aria-label={translations.import}
          >
            <FileText className="h-4 w-4" />
            <span className="sr-only">{translations.import}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                {translations.addFromCsv}
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="w-fit max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-hidden">
              <DialogHeader>
                <DialogTitle>{translations.addFromCsv}</DialogTitle>
              </DialogHeader>
              <div className="pt-4">{appendModalContent}</div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                {translations.replaceAll}
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="w-fit max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-hidden">
              <DialogHeader>
                <DialogTitle>{translations.replaceAll}</DialogTitle>
              </DialogHeader>
              <div className="mt-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                {translations.replaceAllWarning}
              </div>
              <div className="pt-4">{overwriteModalContent}</div>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        size="icon"
        className="size-9 cursor-pointer"
        title={translations.create}
        aria-label={translations.create}
        onClick={onCreateClick}
      >
        <Plus className="h-4 w-4" />
        <span className="sr-only">{translations.create}</span>
      </Button>
    </ResourceActions>
  );
}
