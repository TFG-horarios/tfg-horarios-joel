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
import { DegreeForm } from './degree-form';
import { createDegreeAction, updateDegreeAction } from '../actions';
import type { DegreeDTO, SaveDegreeDTO } from '@tfg-horarios/shared';
import { toast } from 'sonner';

interface DegreeFormModalProps {
  organizationId: string;
  degree?: DegreeDTO;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DegreeFormModal({
  organizationId,
  degree,
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: DegreeFormModalProps) {
  const t = useTranslations('Organizations.degrees');
  const tCommon = useTranslations('Common.actions');
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setIsOpen = isControlled
    ? setControlledOpen || (() => {})
    : setUncontrolledOpen;

  const isEditing = !!degree;

  const handleAction = async (data: SaveDegreeDTO) => {
    if (isEditing) {
      return updateDegreeAction(organizationId, degree.id, data);
    } else {
      return createDegreeAction(organizationId, data);
    }
  };

  const handleSuccess = () => {
    setIsOpen(false);
    toast.success(
      isEditing
        ? 'Grado actualizado correctamente'
        : 'Grado creado correctamente'
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Grado' : t('actions.create')}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <DegreeForm
            action={handleAction}
            defaultValues={degree}
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
