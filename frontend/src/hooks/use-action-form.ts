import { useActionState, useEffect, startTransition, useRef } from 'react';
import {
  useForm,
  type UseFormReturn,
  type DefaultValues,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import type { ActionResponse } from '@/types/actions';
import { useZodErrorMap } from '@/lib/i18n/zod-errors';

export interface UseActionFormOptions<
  TFieldValues extends FieldValues,
  TData = any,
> {
  action: (formData: TFieldValues) => Promise<ActionResponse<TData>>;
  schema: ZodType<TFieldValues, any, any>;
  defaultValues?: DefaultValues<TFieldValues>;
  onSuccess?: (data?: TData) => void;
  onError?: (message?: string, errors?: Record<string, string[]>) => void;
}

export interface UseActionFormReturn<
  TFieldValues extends FieldValues,
  TData = any,
> {
  form: UseFormReturn<TFieldValues>;
  state: ActionResponse<TData> | null;
  isPending: boolean;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export function useActionForm<TFieldValues extends FieldValues, TData = any>({
  action,
  schema,
  defaultValues,
  onSuccess,
  onError,
}: UseActionFormOptions<TFieldValues, TData>): UseActionFormReturn<
  TFieldValues,
  TData
> {
  const zodErrorMap = useZodErrorMap();

  const [state, formAction, isPending] = useActionState(
    async (
      _prevState: ActionResponse<TData> | null,
      formData: TFieldValues
    ) => {
      return await action(formData);
    },
    null
  );

  const form = useForm<TFieldValues>({
    resolver: zodResolver(schema, { error: zodErrorMap }) as any,
    mode: 'onChange',
    defaultValues,
  });

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!state) return;

    if (state.success) {
      onSuccessRef.current?.(state.data);
    } else {
      onErrorRef.current?.(state.message, state.errors);

      if (state.errors) {
        Object.entries(state.errors).forEach(([field, messages]) => {
          if (messages && messages.length > 0) {
            form.setError(field as Path<TFieldValues>, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
    }
  }, [state, form]);

  const onSubmit = (data: TFieldValues) => {
    startTransition(() => {
      formAction(data);
    });
  };

  const handleSubmit = form.handleSubmit(onSubmit);

  return {
    form,
    state,
    isPending,
    handleSubmit,
  };
}
