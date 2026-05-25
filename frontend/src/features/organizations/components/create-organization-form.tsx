'use client';

import { useActionState, useEffect, startTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  SaveOrganizationBodySchema,
  type OrganizationDTO,
  type SaveOrganizationDTO,
} from '@tfg-horarios/shared';
import { createOrganizationAction, type ActionResponse } from '../actions';
import { useZodErrorMap } from '@/lib/i18n/zod-errors';

type CreateOrganizationFormProps = {
  onSuccess?: () => void;
};

export function CreateOrganizationForm({
  onSuccess,
}: CreateOrganizationFormProps) {
  const t = useTranslations('Organizations.form');
  const zodErrorMap = useZodErrorMap();

  type FormState = ActionResponse<OrganizationDTO> | null;
  const [state, formAction, isPending] = useActionState(
    async (prevState: FormState, formData: SaveOrganizationDTO) => {
      return await createOrganizationAction(formData);
    },
    null
  );

  const form = useForm<SaveOrganizationDTO>({
    resolver: zodResolver(SaveOrganizationBodySchema, {
      error: zodErrorMap,
    }),
    mode: 'onChange',
    defaultValues: {
      name: '',
      periodType: 'semester',
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '14:00',
      afternoonEnd: '20:00',
      slotDurationMinutes: 60,
    },
  });

  function onSubmit(data: SaveOrganizationDTO) {
    startTransition(() => {
      formAction(data);
    });
  }

  useEffect(() => {
    if (state?.success) {
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t('name.label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('name.placeholder')} {...field} />
              </FormControl>
              <FormMessage />
              {fieldState.error && (
                <p className="text-xs font-medium text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="periodType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('periodType.label')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('periodType.placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="semester">
                    {t('periodType.options.semester')}
                  </SelectItem>
                  <SelectItem value="trimester">
                    {t('periodType.options.trimester')}
                  </SelectItem>
                  <SelectItem value="annual">
                    {t('periodType.options.annual')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="morningStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('morningStart.label')}</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    placeholder={t('morningStart.placeholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="morningEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('morningEnd.label')}</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    placeholder={t('morningEnd.placeholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="afternoonStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('afternoonStart.label')}</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    placeholder={t('afternoonStart.placeholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="afternoonEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('afternoonEnd.label')}</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    placeholder={t('afternoonEnd.placeholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="slotDurationMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('slotDurationMinutes.label')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="15"
                  max="240"
                  step="15"
                  placeholder={t('slotDurationMinutes.placeholder')}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                {t('slotDurationMinutes.help')}
              </p>
            </FormItem>
          )}
        />

        {state?.success === false && (
          <div
            aria-live="polite"
            className="rounded-lg border px-3 py-2 text-sm text-destructive border-destructive/50 bg-destructive/10"
          >
            {state.message}
          </div>
        )}

        <Button type="submit" className="w-full h-10" disabled={isPending}>
          {isPending ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Form>
  );
}
