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
import { Info, Plus, Loader2 } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { createAcademicYearAction, updateAcademicYearAction } from '../actions';
import { useRouter } from 'next/navigation';
import {
  SaveAcademicYearBodySchema,
  type AcademicYearDTO,
  type OrganizationDTO,
  type SaveAcademicYearBodyDTO,
} from '@tfg-horarios/shared';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('Organizations.academicYears.modal');
  const tCommon = useTranslations('Common.actions');
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
    centerOpeningTime: academicYear?.centerOpeningTime || '08:00',
    centerClosingTime: academicYear?.centerClosingTime || '22:00',
    breakDurationMinutes: String(academicYear?.breakDurationMinutes ?? 30),
    slotDurationMinutes: String(academicYear?.slotDurationMinutes || 60),
  });

  const periodType = formData.periodType;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const slotDurationMinutes = Number(formData.slotDurationMinutes);
      const breakDurationMinutes = Number(formData.breakDurationMinutes);

      if (
        !Number.isFinite(slotDurationMinutes) ||
        !Number.isFinite(breakDurationMinutes)
      ) {
        toast.error(t('errors.invalidDurations'));
        return;
      }

      const payload: SaveAcademicYearBodyDTO = {
        name: formData.name,
        period0Start: formData.period0Start || undefined,
        period0End: formData.period0End || undefined,
        period1Start: formData.period1Start || undefined,
        period1End: formData.period1End || undefined,
        period2Start: formData.period2Start || undefined,
        period2End: formData.period2End || undefined,
        periodType: formData.periodType,
        centerOpeningTime: formData.centerOpeningTime,
        centerClosingTime: formData.centerClosingTime,
        breakDurationMinutes,
        slotDurationMinutes,
      };

      const parsedPayload = SaveAcademicYearBodySchema.safeParse(payload);
      if (!parsedPayload.success) {
        toast.error(
          parsedPayload.error.issues[0]?.message || t('errors.invalidForm')
        );
        return;
      }

      const result = academicYear
        ? await updateAcademicYearAction(
            organization.id,
            academicYear.id,
            parsedPayload.data
          )
        : await createAcademicYearAction(organization.id, parsedPayload.data);

      if (result.success) {
        toast.success(
          academicYear ? t('messages.updated') : t('messages.created')
        );
        setOpen(false);
        onOpenChange?.(false);
        router.refresh();
      } else {
        toast.error(
          result.message ||
            (academicYear ? t('errors.update') : t('errors.create'))
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
            {t('trigger')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg md:max-w-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {academicYear ? t('editTitle') : t('createTitle')}
          </DialogTitle>
          <DialogDescription>
            {academicYear ? t('editDescription') : t('createDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 max-h-[50vh] sm:max-h-[60vh]">
            {academicYear && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/15 border border-amber-500/20 rounded-md text-amber-600 text-sm">
                <p>
                  <strong>{t('warningTitle')}</strong> {t('warningDescription')}
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('fields.name')}</Label>
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
                <Label>{t('fields.periodType')}</Label>
                <Select
                  value={formData.periodType}
                  onValueChange={(value: AcademicYearDTO['periodType']) =>
                    setFormData({ ...formData, periodType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('fields.periodTypePlaceholder')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semester">
                      {t('periodTypes.semester')}
                    </SelectItem>
                    <SelectItem value="trimester">
                      {t('periodTypes.trimester')}
                    </SelectItem>
                    <SelectItem value="annual">
                      {t('periodTypes.annual')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('fields.periodStart', { period: 1 })}</Label>
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
                <Label>{t('fields.periodEnd', { period: 1 })}</Label>
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
                  <Label>{t('fields.periodStart', { period: 2 })}</Label>
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
                  <Label>{t('fields.periodEnd', { period: 2 })}</Label>
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
                  <Label>{t('fields.periodStart', { period: 3 })}</Label>
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
                  <Label>{t('fields.periodEnd', { period: 3 })}</Label>
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
                {t('sections.timeConfig')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>{t('fields.openingTime')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={t('help.opening.aria')}
                        >
                          <Info className="size-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="max-w-xs text-sm"
                      >
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">
                            {t('help.opening.title')}
                          </p>
                          <p className="text-muted-foreground">
                            {t('help.opening.description')}
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input
                    type="time"
                    required
                    value={formData.centerOpeningTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        centerOpeningTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>{t('fields.closingTime')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={t('help.closing.aria')}
                        >
                          <Info className="size-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="max-w-xs text-sm"
                      >
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">
                            {t('help.closing.title')}
                          </p>
                          <p className="text-muted-foreground">
                            {t('help.closing.description')}
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input
                    type="time"
                    required
                    value={formData.centerClosingTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        centerClosingTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>{t('fields.slotDuration')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={t('help.slotDuration.aria')}
                        >
                          <Info className="size-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="max-w-xs text-sm"
                      >
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">
                            {t('help.slotDuration.title')}
                          </p>
                          <p className="text-muted-foreground">
                            {t('help.slotDuration.description')}
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input
                    type="number"
                    min={15}
                    max={240}
                    required
                    value={formData.slotDurationMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slotDurationMinutes: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('fields.breakDuration')}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={240}
                    required
                    value={formData.breakDurationMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        breakDurationMinutes: e.target.value,
                      })
                    }
                  />
                </div>
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
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {academicYear ? tCommon('saveChanges') : tCommon('create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
