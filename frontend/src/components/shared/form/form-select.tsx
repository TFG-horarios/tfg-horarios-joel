'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/styles';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

interface FormSelectOption {
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
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function FormSelect({
  name,
  label,
  placeholder,
  helpText,
  options,
  disabled,
  searchable = false,
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No hay resultados.',
}: FormSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col w-full">
          {label && <FormLabel>{label}</FormLabel>}
          {searchable ? (
            <Popover modal open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                      'w-full justify-between font-normal border border-border bg-card text-card-foreground cursor-pointer hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:text-foreground dark:hover:bg-input/50',
                      !field.value && 'text-muted-foreground'
                    )}
                    disabled={disabled}
                  >
                    <span className="truncate">
                      {field.value
                        ? options.find(
                            (opt) => opt.value === field.value?.toString()
                          )?.label
                        : placeholder}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto min-w-[var(--radix-popover-trigger-width)] max-w-[400px] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder={searchPlaceholder} />
                  <CommandList>
                    <CommandEmpty>{emptyMessage}</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          data-state={
                            option.value === field.value?.toString()
                              ? 'checked'
                              : 'unchecked'
                          }
                          onSelect={() => {
                            field.onChange(option.value);
                            setOpen(false);
                          }}
                        >
                          <span className="break-words">{option.label}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          ) : (
            <Select
              onValueChange={field.onChange}
              value={field.value?.toString()}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger className="w-full bg-card">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent position="popper">
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <FormMessage />
          {helpText && (
            <p className="text-xs text-muted-foreground">{helpText}</p>
          )}
        </FormItem>
      )}
    />
  );
}
