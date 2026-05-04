'use client';

import { useActionState } from 'react';
import { type LoginDTO } from '@tfg-horarios/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction, type AuthActionState } from '@/features/auth/actions';
import { cn } from '@/lib/utils';

type FieldErrors = Partial<Record<keyof LoginDTO, string[]>>;

const initialState: AuthActionState = {
  success: false,
  message: '',
  fieldErrors: {},
  user: null,
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  const fieldErrors = state.fieldErrors as FieldErrors;

  return (
    <form className="space-y-4" action={formAction}>
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
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
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
            'rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300'
          )}
        >
          {state.message}
        </div>
      ) : null}

      <Button type="submit" className="h-10 w-full" disabled={isPending}>
        {isPending ? 'Accediendo...' : 'Iniciar sesión'}
      </Button>
    </form>
  );
}
