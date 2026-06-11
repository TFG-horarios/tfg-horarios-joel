'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
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
import { toast } from 'sonner';
import { createAcademicYearAction } from '../actions';
import { useRouter } from 'next/navigation';

export function AcademicYearFormModal({
  organizationId,
  trigger,
}: {
  organizationId: string;
  trigger?: React.ReactNode;
}) {
  const t = useTranslations('Organizations.detail');
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    period0Start: '',
    period0End: '',
    period1Start: '',
    period1End: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createAcademicYearAction(organizationId, {
        name: formData.name,
        period0Start: formData.period0Start || undefined,
        period0End: formData.period0End || undefined,
        period1Start: formData.period1Start || undefined,
        period1End: formData.period1End || undefined,
      } as any);

      if (result.success) {
        toast.success('Curso académico creado correctamente');
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message || 'Error al crear el curso');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Curso
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Curso Académico</DialogTitle>
          <DialogDescription>
            Configura el nuevo año académico y sus períodos lectivos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
          <div className="grid grid-cols-2 gap-4">
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
                    period0Start: date
                      ? (date.toISOString().split('T')[0] ?? '')
                      : '',
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
                    period0End: date
                      ? (date.toISOString().split('T')[0] ?? '')
                      : '',
                  })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Inicio Período 2 (Opcional)</Label>
              <DatePicker
                value={
                  formData.period1Start
                    ? new Date(formData.period1Start + 'T12:00:00')
                    : undefined
                }
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    period1Start: date
                      ? (date.toISOString().split('T')[0] ?? '')
                      : '',
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fin Período 2 (Opcional)</Label>
              <DatePicker
                value={
                  formData.period1End
                    ? new Date(formData.period1End + 'T12:00:00')
                    : undefined
                }
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    period1End: date
                      ? (date.toISOString().split('T')[0] ?? '')
                      : '',
                  })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Curso
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
