'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, FileUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { ItineraryBulkUploader } from '@/features/itinerary/components/itinerary-bulk-uploader';
import type { ItineraryDTO, DegreeDTO } from '@tfg-horarios/shared';
import { useTranslations } from 'next-intl';

interface ItineraryActionsProps {
  organizationId: string;
  existingItineraries: ItineraryDTO[];
  degrees: DegreeDTO[];
}

export function ItineraryActions({
  organizationId,
  existingItineraries,
  degrees,
}: ItineraryActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations('Organizations.itineraries.actions');

  const handleDeleteAll = async () => {
    try {
      setIsDeleting(true);
      await fetch(`/api/organizations/${organizationId}/itineraries`, {
        method: 'DELETE',
      });
      router.refresh();
    } catch (error) {
      console.error('Error al eliminar itinerarios:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ResourceActions>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteAllTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteAllDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? t('deleting') : t('deleteAllConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <FileUp className="mr-2 h-4 w-4" /> {t('import')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                {t('addFromCsv')}
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{t('addFromCsv')}</DialogTitle>
              </DialogHeader>
              <div className="pt-4">
                <ItineraryBulkUploader
                  organizationId={organizationId}
                  degrees={degrees}
                  existingItineraries={existingItineraries}
                  mode="append"
                />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                {t('replaceAll')}
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{t('replaceAll')}</DialogTitle>
              </DialogHeader>
              <div className="mt-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                {t('replaceAllWarning')}
              </div>
              <div className="pt-4">
                <ItineraryBulkUploader
                  organizationId={organizationId}
                  degrees={degrees}
                  existingItineraries={existingItineraries}
                  mode="overwrite"
                />
              </div>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button>
        <Plus className="mr-2 h-4 w-4" /> {t('create')}
      </Button>
    </ResourceActions>
  );
}
