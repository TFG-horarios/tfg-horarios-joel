import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import type { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';

interface FormCheckboxProps {
  name: string;
  label?: ReactNode;
  helpText?: ReactNode;
}

export function FormCheckbox({ name, label, helpText }: FormCheckboxProps) {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
          <FormControl>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
              checked={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              name={field.name}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            {label && <FormLabel>{label}</FormLabel>}
            {helpText && (
              <p className="text-sm text-muted-foreground">{helpText}</p>
            )}
          </div>
        </FormItem>
      )}
    />
  );
}
