import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { ComponentProps, ReactNode } from 'react';

type FormInputProps = ComponentProps<'input'> & {
  name: string;
  label?: ReactNode;
  helpText?: ReactNode;
};

export function FormInput({ name, label, helpText, ...props }: FormInputProps) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Input {...field} value={field.value ?? ''} {...props} />
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
