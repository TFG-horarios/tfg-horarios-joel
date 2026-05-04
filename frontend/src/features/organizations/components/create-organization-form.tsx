'use client';

import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateOrganizationDTO } from '@tfg-horarios/shared';
import { cn } from '@/lib/utils';
import {
  createOrganizationAction,
  type OrganizationActionState,
} from '../actions';

type FormData = Omit<CreateOrganizationDTO, 'createdAt' | 'updatedAt' | 'id'>;

type FieldErrors = Partial<Record<keyof FormData, string[]>>;

const initialState: OrganizationActionState = {
  success: false,
  message: '',
  fieldErrors: {},
  organization: null,
};

type CreateOrganizationFormProps = {
  onSuccess?: () => void;
};

export function CreateOrganizationForm({
  onSuccess,
}: CreateOrganizationFormProps) {
  const [state, formAction, isPending] = useActionState(
    createOrganizationAction,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
    }
  }, [onSuccess, state.success]);

  const fieldErrors = state.fieldErrors as FieldErrors;

  return (
    <form className="space-y-5" action={formAction}>
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">
          Nombre de la organización *
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Ej: Instituto Técnico San Juan"
          required
          className="dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
        />
        {fieldErrors.name?.length ? (
          <p className="text-xs text-rose-300">{fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="periodType" className="text-white">
          Tipo de período *
        </Label>
        <select
          id="periodType"
          name="periodType"
          className="w-full px-3 py-2 border border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="semester">Semestral</option>
          <option value="trimester">Trimestral</option>
          <option value="annual">Anual</option>
        </select>
        {fieldErrors.periodType?.length ? (
          <p className="text-xs text-rose-300">{fieldErrors.periodType[0]}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="morningStart" className="text-white">
            Inicio mañana *
          </Label>
          <Input
            id="morningStart"
            name="morningStart"
            type="time"
            required
            defaultValue="08:00"
            className="dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
          />
          {fieldErrors.morningStart?.length ? (
            <p className="text-xs text-rose-300">
              {fieldErrors.morningStart[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="morningEnd" className="text-white">
            Fin mañana *
          </Label>
          <Input
            id="morningEnd"
            name="morningEnd"
            type="time"
            required
            defaultValue="14:00"
            className="dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
          />
          {fieldErrors.morningEnd?.length ? (
            <p className="text-xs text-rose-300">{fieldErrors.morningEnd[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="afternoonStart" className="text-white">
            Inicio tarde *
          </Label>
          <Input
            id="afternoonStart"
            name="afternoonStart"
            type="time"
            required
            defaultValue="14:00"
            className="dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
          />
          {fieldErrors.afternoonStart?.length ? (
            <p className="text-xs text-rose-300">
              {fieldErrors.afternoonStart[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="afternoonEnd" className="text-white">
            Fin tarde *
          </Label>
          <Input
            id="afternoonEnd"
            name="afternoonEnd"
            type="time"
            required
            defaultValue="20:00"
            className="dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
          />
          {fieldErrors.afternoonEnd?.length ? (
            <p className="text-xs text-rose-300">
              {fieldErrors.afternoonEnd[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slotDurationMinutes" className="text-white">
          Duración por clase (minutos) *
        </Label>
        <Input
          id="slotDurationMinutes"
          name="slotDurationMinutes"
          defaultValue={60}
          type="number"
          min="15"
          max="240"
          step="15"
          required
          className="dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
        />
        {fieldErrors.slotDurationMinutes?.length ? (
          <p className="text-xs text-rose-300">
            {fieldErrors.slotDurationMinutes[0]}
          </p>
        ) : null}
      </div>

      {state.message && (
        <div
          aria-live="polite"
          className={cn(
            'rounded-lg border px-3 py-2 text-sm',
            state.success
              ? 'border-emerald-900/50 bg-emerald-950/40 text-emerald-300'
              : 'border-rose-900/50 bg-rose-950/40 text-rose-300'
          )}
        >
          {state.message}
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-10 bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-medium"
        disabled={isPending}
      >
        {isPending ? 'Creando organización...' : 'Crear organización'}
      </Button>
    </form>
  );
}
