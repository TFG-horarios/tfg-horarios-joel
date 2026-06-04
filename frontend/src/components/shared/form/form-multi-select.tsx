import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { MultiSelect } from '@/components/ui/multi-select';
import type { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';

type Option = {
  label: string;
  value: string;
};

interface FormMultiSelectProps {
  name: string;
  label?: ReactNode;
  options: Option[];
  placeholder?: string;
  emptyMessage?: string;
  helpText?: ReactNode;
}

export function FormMultiSelect({
  name,
  label,
  options,
  placeholder,
  emptyMessage,
  helpText,
}: FormMultiSelectProps) {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <MultiSelect
              options={options}
              selected={field.value || []}
              onChange={field.onChange}
              placeholder={placeholder}
              emptyMessage={emptyMessage}
            />
          </FormControl>
          <FormMessage />
          {helpText && (
            <p className="text-xs text-muted-foreground">{helpText}</p>
          )}
        </FormItem>
      )}
    />
  );
}
