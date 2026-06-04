'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  SubjectGroupForm,
  type SubjectGroupFormDTO,
} from './subject-group-form';
import { createSubjectGroupAction, updateSubjectGroupAction } from '../actions';
import type { SubjectGroupDTO, SubjectDTO } from '@tfg-horarios/shared';
import { toast } from 'sonner';

interface SubjectGroupFormModalProps {
  organizationId: string;
  subjects: SubjectDTO[];
  group?: SubjectGroupDTO;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SubjectGroupFormModal({
  organizationId,
  subjects,
  group,
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: SubjectGroupFormModalProps) {
  const t = useTranslations('Organizations.subjectGroups');
  const tCommon = useTranslations('Common.actions');
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setIsOpen = isControlled
    ? setControlledOpen || (() => {})
    : setUncontrolledOpen;

  const isEditing = !!group;

  const handleAction = async (data: SubjectGroupFormDTO) => {
    const { ...finalData } = data;

    if (isEditing) {
      return updateSubjectGroupAction(organizationId, group.id, finalData);
    } else {
      if (!data.subjectId) {
        return {
          success: false as const,
          message: 'La asignatura es obligatoria',
        };
      }
      return createSubjectGroupAction(
        organizationId,
        data.subjectId,
        finalData
      );
    }
  };

  const handleSuccess = () => {
    setIsOpen(false);
    toast.success(
      isEditing
        ? 'Grupo actualizado correctamente'
        : 'Grupo creado correctamente'
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Grupo' : t('actions.create')}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <SubjectGroupForm
            action={handleAction}
            subjects={subjects}
            isEditing={isEditing}
            defaultValues={group ? { ...group } : undefined}
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
