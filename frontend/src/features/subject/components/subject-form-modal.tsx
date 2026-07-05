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
import { SubjectForm, type SubjectFormDTO } from './subject-form';
import { createSubjectAction, updateSubjectAction } from '../actions';
import type {
  SubjectDTO,
  DegreeDTO,
  ItineraryDTO,
  OrganizationDTO,
  AcademicYearDTO,
} from '@tfg-horarios/shared';
import { toast } from 'sonner';

interface SubjectFormModalProps {
  organization: OrganizationDTO;
  academicYear: AcademicYearDTO;
  degrees: DegreeDTO[];
  itineraries: ItineraryDTO[];
  subject?: SubjectDTO;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SubjectFormModal({
  organization,
  academicYear,
  degrees,
  itineraries,
  subject,
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: SubjectFormModalProps) {
  const t = useTranslations('Organizations.subjects');
  const tCommon = useTranslations('Common.actions');
  const tCommonErrors = useTranslations('Common.errors');
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setIsOpen = isControlled
    ? setControlledOpen || (() => {})
    : setUncontrolledOpen;

  const isEditing = !!subject;

  const handleAction = async (data: SubjectFormDTO) => {
    const finalData = { ...data };
    if (finalData.isCommon) {
      finalData.itineraryId = undefined;
    }

    if (isEditing) {
      return updateSubjectAction(organization.id, subject.id, finalData);
    } else {
      if (!data.degreeId) {
        const message = tCommonErrors('degreeRequired');
        return {
          success: false as const,
          message,
          errors: { degreeId: [message] },
        };
      }
      return createSubjectAction(organization.id, data.degreeId, finalData);
    }
  };

  const handleSuccess = () => {
    setIsOpen(false);
    toast.success(isEditing ? t('messages.updated') : t('messages.created'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('actions.edit') : t('actions.create')}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <SubjectForm
            periodType={academicYear.periodType}
            action={handleAction}
            degrees={degrees}
            itineraries={itineraries}
            isEditing={isEditing}
            defaultValues={
              subject
                ? {
                    ...subject,
                    itineraryId: subject.itineraryId ?? undefined,
                  }
                : undefined
            }
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
