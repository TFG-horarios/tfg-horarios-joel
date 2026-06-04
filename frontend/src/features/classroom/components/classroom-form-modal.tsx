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
import { ClassroomForm } from './classroom-form';
import { createClassroomAction, updateClassroomAction } from '../actions';
import type { ClassroomDTO, SaveClassroomDTO } from '@tfg-horarios/shared';
import { toast } from 'sonner';

interface ClassroomFormModalProps {
  organizationId: string;
  classroom?: ClassroomDTO;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ClassroomFormModal({
  organizationId,
  classroom,
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: ClassroomFormModalProps) {
  const t = useTranslations('Organizations.classrooms');
  const tCommon = useTranslations('Common.actions');
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setIsOpen = isControlled
    ? setControlledOpen || (() => {})
    : setUncontrolledOpen;

  const isEditing = !!classroom;

  const handleAction = async (data: SaveClassroomDTO) => {
    if (isEditing) {
      return updateClassroomAction(organizationId, classroom.id, data);
    } else {
      return createClassroomAction(organizationId, data);
    }
  };

  const handleSuccess = () => {
    setIsOpen(false);
    toast.success(
      isEditing ? 'Aula actualizada correctamente' : 'Aula creada correctamente'
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Aula' : t('actions.create')}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <ClassroomForm
            action={handleAction}
            defaultValues={classroom}
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
