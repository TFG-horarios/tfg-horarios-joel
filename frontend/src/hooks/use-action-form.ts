import { useActionState, useEffect, startTransition } from 'react';
import {
  useForm,
  type UseFormReturn,
  type DefaultValues,
  type FieldValues,
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

  useEffect(() => {
    if (state?.success) {
      onSuccess?.(state.data);
    }
  }, [state, onSuccess]);

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
