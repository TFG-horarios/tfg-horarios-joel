'use client';

import { useState, useTransition, type FormEvent, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createAcademicYearAction, updateAcademicYearAction } from '../actions';
import { useRouter } from 'next/navigation';
import type {
  AcademicYearDTO,
  OrganizationDTO,
  SaveAcademicYearBodyDTO,
} from '@tfg-horarios/shared';

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function AcademicYearFormModal({
  organization,
  academicYear,
  trigger,
  defaultOpen,
  onOpenChange,
}: {
  organization: OrganizationDTO;
  academicYear?: AcademicYearDTO;
  trigger?: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(defaultOpen || false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: academicYear?.name || '',
    period0Start: academicYear?.period0Start || '',
    period0End: academicYear?.period0End || '',
    period1Start: academicYear?.period1Start || '',
    period1End: academicYear?.period1End || '',
    period2Start: academicYear?.period2Start || '',
    period2End: academicYear?.period2End || '',
    periodType: academicYear?.periodType || 'semester',
    morningStart: academicYear?.morningStart || '08:00',
    morningEnd: academicYear?.morningEnd || '14:00',
    afternoonStart: academicYear?.afternoonStart || '14:00',
    afternoonEnd: academicYear?.afternoonEnd || '20:00',
    slotDurationMinutes: academicYear?.slotDurationMinutes || 60,
  });

  const periodType = formData.periodType;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload: SaveAcademicYearBodyDTO = {
        name: formData.name,
        period0Start: formData.period0Start || undefined,
        period0End: formData.period0End || undefined,
        period1Start: formData.period1Start || undefined,
        period1End: formData.period1End || undefined,
        period2Start: formData.period2Start || undefined,
        period2End: formData.period2End || undefined,
        periodType: formData.periodType,
        morningStart: formData.morningStart,
        morningEnd: formData.morningEnd,
        afternoonStart: formData.afternoonStart,
        afternoonEnd: formData.afternoonEnd,
        slotDurationMinutes: formData.slotDurationMinutes,
      };

      const result = academicYear
        ? await updateAcademicYearAction(
            organization.id,
            academicYear.id,
            payload
          )
        : await createAcademicYearAction(organization.id, payload);

      if (result.success) {
        toast.success(
          `Curso académico ${academicYear ? 'actualizado' : 'creado'} correctamente`
        );
        setOpen(false);
        onOpenChange?.(false);
        router.refresh();
      } else {
        toast.error(
          result.message ||
            `Error al ${academicYear ? 'actualizar' : 'crear'} el curso`
        );
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        onOpenChange?.(val);
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Curso
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg md:max-w-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {academicYear
              ? 'Editar Curso Académico'
              : 'Crear Nuevo Curso Académico'}
          </DialogTitle>
          <DialogDescription>
            {academicYear
              ? 'Edita la configuración del año académico y su cuadrícula.'
              : 'Configura el nuevo año académico y sus períodos lectivos.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 max-h-[50vh] sm:max-h-[60vh]">
            {academicYear && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/15 border border-amber-500/20 rounded-md text-amber-600 text-sm">
                <p>
                  <strong>¡Atención!</strong> Si editas los horarios de
                  inicio/fin de turnos o la duración de clase, los horarios
                  existentes cambiarán de acuerdo a los nuevos parámetros
                  visualmente.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del curso (ej. 2025-2026)</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="2025-2026"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Períodos</Label>
                <Select
                  value={formData.periodType}
                  onValueChange={(value: AcademicYearDTO['periodType']) =>
                    setFormData({ ...formData, periodType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semester">
                      Semestral (2 periodos)
                    </SelectItem>
                    <SelectItem value="trimester">
                      Trimestral (3 periodos)
                    </SelectItem>
                    <SelectItem value="annual">Anual (1 periodo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Inicio Período 1</Label>
                <DatePicker
                  value={
                    formData.period0Start
                      ? new Date(formData.period0Start + 'T12:00:00')
                      : undefined
                  }
                  onChange={(date) =>
                    setFormData({
                      ...formData,
                      period0Start: date ? formatDate(date) : '',
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Fin Período 1</Label>
                <DatePicker
                  value={
                    formData.period0End
                      ? new Date(formData.period0End + 'T12:00:00')
                      : undefined
                  }
                  onChange={(date) =>
                    setFormData({
                      ...formData,
                      period0End: date ? formatDate(date) : '',
                    })
                  }
                />
              </div>
            </div>
            {(periodType === 'semester' || periodType === 'trimester') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Inicio Período 2</Label>
                  <DatePicker
                    value={
                      formData.period1Start
                        ? new Date(formData.period1Start + 'T12:00:00')
                        : undefined
                    }
                    onChange={(date) =>
                      setFormData({
                        ...formData,
                        period1Start: date ? formatDate(date) : '',
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fin Período 2</Label>
                  <DatePicker
                    value={
                      formData.period1End
                        ? new Date(formData.period1End + 'T12:00:00')
                        : undefined
                    }
                    onChange={(date) =>
                      setFormData({
                        ...formData,
                        period1End: date ? formatDate(date) : '',
                      })
                    }
                  />
                </div>
              </div>
            )}
            {periodType === 'trimester' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Inicio Período 3</Label>
                  <DatePicker
                    value={
                      formData.period2Start
                        ? new Date(formData.period2Start + 'T12:00:00')
                        : undefined
                    }
                    onChange={(date) =>
                      setFormData({
                        ...formData,
                        period2Start: date ? formatDate(date) : '',
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fin Período 3</Label>
                  <DatePicker
                    value={
                      formData.period2End
                        ? new Date(formData.period2End + 'T12:00:00')
                        : undefined
                    }
                    onChange={(date) =>
                      setFormData({
                        ...formData,
                        period2End: date ? formatDate(date) : '',
                      })
                    }
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border mt-4">
              <h4 className="text-sm font-semibold mb-3">
                Configuración de Horarios
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Inicio Mañana</Label>
                  <Input
                    type="time"
                    required
                    value={formData.morningStart}
                    onChange={(e) =>
                      setFormData({ ...formData, morningStart: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fin Mañana</Label>
                  <Input
                    type="time"
                    required
                    value={formData.morningEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, morningEnd: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Inicio Tarde</Label>
                  <Input
                    type="time"
                    required
                    value={formData.afternoonStart}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        afternoonStart: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fin Tarde</Label>
                  <Input
                    type="time"
                    required
                    value={formData.afternoonEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, afternoonEnd: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Duración del Slot (minutos)</Label>
                <Input
                  type="number"
                  min={15}
                  max={240}
                  required
                  value={formData.slotDurationMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slotDurationMinutes: parseInt(e.target.value) || 60,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 p-6 border-t border-border bg-muted/20 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                onOpenChange?.(false);
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {academicYear ? 'Guardar Cambios' : 'Crear Curso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
