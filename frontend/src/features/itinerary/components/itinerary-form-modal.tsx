'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ItineraryForm, type ItineraryFormDTO } from './itinerary-form';
import { createItineraryAction, updateItineraryAction } from '../actions';
import type { ItineraryDTO, DegreeDTO } from '@tfg-horarios/shared';
import { toast } from 'sonner';

interface ItineraryFormModalProps {
  organizationId: string;
  degrees: DegreeDTO[];
  itinerary?: ItineraryDTO;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ItineraryFormModal({
  organizationId,
  degrees,
  itinerary,
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: ItineraryFormModalProps) {
  const t = useTranslations('Organizations.itineraries');
  const tCommon = useTranslations('Common.actions');
  const tCommonErrors = useTranslations('Common.errors');
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setIsOpen = isControlled
    ? setControlledOpen || (() => {})
    : setUncontrolledOpen;

  const isEditing = !!itinerary;

  const handleAction = async (data: ItineraryFormDTO) => {
    if (isEditing) {
      return updateItineraryAction(
        organizationId,
        itinerary.degreeId,
        itinerary.id,
        {
          name: data.name,
          code: data.code,
        }
      );
    } else {
      if (!data.degreeId) {
        const message = tCommonErrors('degreeRequired');
        return {
          success: false as const,
          message,
          errors: { degreeId: [message] },
        };
      }
      return createItineraryAction(organizationId, data.degreeId, {
        name: data.name,
        code: data.code,
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
        </DialogHeader>
        <div className="py-4">
          <ItineraryForm
            action={handleAction}
            degrees={degrees}
            isEditing={isEditing}
            defaultValues={{
              name: itinerary?.name ?? '',
              code: itinerary?.code ?? '',
              degreeId: itinerary?.degreeId ?? '',
            }}
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
