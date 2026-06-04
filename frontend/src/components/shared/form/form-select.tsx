import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ReactNode } from 'react';

export interface FormSelectOption {
  label: string;
  value: string;
}

export interface FormSelectProps {
  name: string;
  label?: ReactNode;
  placeholder?: string;
  helpText?: ReactNode;
  options: FormSelectOption[];
  disabled?: boolean;
}

export function FormSelect({
  name,
  label,
  placeholder,
  helpText,
  options,
  disabled,
}: FormSelectProps) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <Select
            onValueChange={field.onChange}
            value={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
          {helpText && (
            <p className="text-xs text-muted-foreground">{helpText}</p>
          )}
        </FormItem>
      )}
    />
  );
}
