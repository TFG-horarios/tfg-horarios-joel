'use client';

import { useActionState } from 'react';
import { type RegisterDTO } from '@tfg-horarios/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerAction, type AuthActionState } from '@/features/auth/actions';
import { cn } from '@/lib/utils';

type FieldErrors = Partial<Record<keyof RegisterDTO, string[]>>;

const initialState: AuthActionState = {
  success: false,
  message: '',
  fieldErrors: {},
  user: null,
};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  );

  const fieldErrors = state.fieldErrors as FieldErrors;

  return (
    <form className="space-y-4" action={formAction}>
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Nombre y apellido"
          minLength={2}
          required
          aria-invalid={Boolean(fieldErrors.name?.length)}
          aria-describedby={fieldErrors.name ? 'name-error' : undefined}
        />
        {fieldErrors.name?.length ? (
          <p id="name-error" className="text-xs text-destructive">
            {fieldErrors.name[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          required
          aria-invalid={Boolean(fieldErrors.email?.length)}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
        />
        {fieldErrors.email?.length ? (
          <p id="email-error" className="text-xs text-destructive">
            {fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contrasena</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimo 10 caracteres"
          minLength={10}
          required
          aria-invalid={Boolean(fieldErrors.password?.length)}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
        />
      </div>

      {state.message ? (
        <div
          aria-live="polite"
          className={cn(
            'rounded-lg border px-3 py-2 text-sm',
            state.success
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300'
          )}
        >
          {state.message}
        </div>
      ) : null}

      <Button type="submit" className="h-10 w-full" disabled={isPending}>
        {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
      </Button>
    </form>
  );
}
