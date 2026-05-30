'use client';

import { useMemo, useState } from 'react';
import type { ClassroomDTO } from '@tfg-horarios/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ClassroomActions } from '@/features/classroom/components/classroom-actions';
import { ClassroomCard } from '@/features/classroom/components/classroom-card';

type ClassroomTypeFilter = 'all' | ClassroomDTO['type'];

interface ClassroomBrowserProps {
  organizationId: string;
  classrooms: ClassroomDTO[];
  translations: Record<string, string>;
}

export function ClassroomBrowser({
  organizationId,
  classrooms,
  translations,
}: ClassroomBrowserProps) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<ClassroomTypeFilter>('all');
  const [minCapacity, setMinCapacity] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');

  const filteredClassrooms = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const min = minCapacity === '' ? null : Number(minCapacity);
    const max = maxCapacity === '' ? null : Number(maxCapacity);

    return classrooms.filter((classroom) => {
      if (
        normalizedSearch &&
        !classroom.name.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (type !== 'all' && classroom.type !== type) {
        return false;
      }

      if (min !== null && !Number.isNaN(min) && classroom.capacity < min) {
        return false;
      }

      if (max !== null && !Number.isNaN(max) && classroom.capacity > max) {
        return false;
      }

      return true;
    });
  }, [classrooms, maxCapacity, minCapacity, search, type]);

  const hasActiveFilters =
    search.trim() !== '' ||
    type !== 'all' ||
    minCapacity !== '' ||
    maxCapacity !== '';

  const clearFilters = () => {
    setSearch('');
    setType('all');
    setMinCapacity('');
    setMaxCapacity('');
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-4 border-b border-border/50 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <ResourceToolbar
          search={
            <div className="space-y-1">
              <Label
                htmlFor="classroom-search"
                className="text-sm text-muted-foreground"
              >
                {translations.searchLabel}
              </Label>
              <Input
                id="classroom-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={translations.searchPlaceholder}
                className="w-full"
              />
            </div>
          }
          filters={
            <div className="grid w-full gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(10rem,11rem)_minmax(6.5rem,7.5rem)_minmax(6.5rem,7.5rem)_auto]">
              <div className="min-w-0 space-y-1">
                <Label
                  htmlFor="classroom-type"
                  className="block whitespace-normal text-sm text-muted-foreground"
                >
                  {translations.typeFilterLabel}
                </Label>
                <Select
                  value={type}
                  onValueChange={(value) =>
                    setType(value as ClassroomTypeFilter)
                  }
                >
                  <SelectTrigger id="classroom-type" className="w-full">
                    <SelectValue placeholder={translations.typeFilterLabel} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{translations.allTypes}</SelectItem>
                    <SelectItem value="theory">
                      {translations['type.theory']}
                    </SelectItem>
                    <SelectItem value="lab">
                      {translations['type.lab']}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-1">
                <Label
                  htmlFor="classroom-min-capacity"
                  className="block whitespace-normal text-sm text-muted-foreground"
                >
                  {translations.capacityMinLabel}
                </Label>
                <Input
                  id="classroom-min-capacity"
                  type="number"
                  min="0"
                  value={minCapacity}
                  onChange={(event) => setMinCapacity(event.target.value)}
                  placeholder="0"
                  className="w-full"
                />
              </div>

              <div className="min-w-0 space-y-1">
                <Label
                  htmlFor="classroom-max-capacity"
                  className="block whitespace-normal text-sm text-muted-foreground"
                >
                  {translations.capacityMaxLabel}
                </Label>
                <Input
                  id="classroom-max-capacity"
                  type="number"
                  min="0"
                  value={maxCapacity}
                  onChange={(event) => setMaxCapacity(event.target.value)}
                  placeholder="100"
                  className="w-full"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="h-8 self-end sm:self-auto"
              >
                {translations.resetFilters}
              </Button>
            </div>
          }
        />
        <ClassroomActions
          organizationId={organizationId}
          existingClassrooms={classrooms}
        />
      </div>

      {filteredClassrooms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            {hasActiveFilters ? translations.filteredEmpty : translations.empty}
          </p>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="mt-4"
            >
              {translations.resetFilters}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredClassrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              classroom={classroom}
              translations={translations}
            />
          ))}
        </div>
      )}
    </div>
  );
}
