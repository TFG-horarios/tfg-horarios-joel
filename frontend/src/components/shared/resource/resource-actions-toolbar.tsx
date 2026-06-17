'use client';

import { useState } from 'react';
import { Trash2, Plus, Upload, Download } from 'lucide-react';
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
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  onDeleteAll: () => Promise<{ success: boolean; message?: string }>;
  appendModalContent: React.ReactNode;
  overwriteModalContent: React.ReactNode;
  onCreateClick?: () => void;
  onExportCsv?: () => void;
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
    exportCsv?: string;
  };
}

export function ResourceActionsToolbar({
  onDeleteAll,
  appendModalContent,
  overwriteModalContent,
  onCreateClick,
  onExportCsv,
  translations,
}: ResourceActionsToolbarProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteAll = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      const result = await onDeleteAll();
      if (!result.success && result.message) {
        setError(result.message);
      } else {
        setIsDeleteDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <ResourceActions>
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) {
              setError(null);
            }
          }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 cursor-pointer border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  aria-label={translations.deleteAllConfirm}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">
                    {translations.deleteAllConfirm}
                  </span>
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>{translations.deleteAllConfirm}</TooltipContent>
          </Tooltip>
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
              <AlertDialogAction
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
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 cursor-pointer"
                  aria-label={translations.import}
                >
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">{translations.import}</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>{translations.import}</TooltipContent>
          </Tooltip>
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

        {onExportCsv && translations.exportCsv && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-9 cursor-pointer"
                aria-label={translations.exportCsv}
                onClick={onExportCsv}
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">{translations.exportCsv}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{translations.exportCsv}</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="size-9 cursor-pointer"
              aria-label={translations.create}
              onClick={onCreateClick}
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">{translations.create}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{translations.create}</TooltipContent>
        </Tooltip>
      </ResourceActions>
    </TooltipProvider>
  );
}
