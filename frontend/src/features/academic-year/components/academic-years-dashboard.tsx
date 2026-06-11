'use client';

import { useSearchParams } from 'next/navigation';
import { Plus, CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AcademicYearFormModal } from './academic-year-form-modal';
import { type AcademicYearDTO } from '@tfg-horarios/shared';
import { AcademicYearCard } from './academic-year-card';
import { DashboardGrid } from '@/components/layout/dashboard-grid';

type AcademicYearsDashboardProps = {
  organizationId: string;
  initialAcademicYears: AcademicYearDTO[];
  isAdmin: boolean;
};

export function AcademicYearsDashboard({
  organizationId,
  initialAcademicYears,
  isAdmin,
}: AcademicYearsDashboardProps) {
  const searchParams = useSearchParams();
  const t = useTranslations('Organizations.academicYearsDashboard');

  const academicYears = initialAcademicYears;
  const searchQuery = searchParams.get('q') ?? '';
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredAcademicYears =
    normalizedQuery.length > 0
      ? academicYears.filter((ay) =>
          ay.name.toLowerCase().includes(normalizedQuery)
        )
      : academicYears;

  const academicYearCountLabel =
    academicYears.length === 1
      ? '1 curso académico'
      : `${academicYears.length} cursos académicos`;

  return (
    <DashboardGrid
      icon={
        <CalendarDays className="size-5 text-purple-600 dark:text-purple-200" />
      }
      title="Cursos Académicos"
      countLabel={academicYearCountLabel}
      description="Selecciona un curso académico para gestionar sus horarios y configuración."
      actionButton={
        isAdmin ? (
          <AcademicYearFormModal
            organizationId={organizationId}
            trigger={
              <Button className="h-11 shrink-0 cursor-pointer bg-purple-600/90 px-5 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-600/80 dark:bg-purple-500/80 dark:hover:bg-purple-500/70">
                Crear curso
              </Button>
            }
          />
        ) : undefined
      }
    >
      {filteredAcademicYears.map((ay) => (
        <AcademicYearCard
          key={ay.id}
          organizationId={organizationId}
          academicYear={ay}
        />
      ))}

      {isAdmin && (
        <AcademicYearFormModal
          organizationId={organizationId}
          trigger={
            <Card
              role="button"
              tabIndex={0}
              className="group hover-lift h-full min-h-48 cursor-pointer border-2 border-dashed border-black/10 bg-transparent p-6 transition-all duration-300 hover:border-purple-400/40 hover:shadow-lg hover:shadow-black/10 dark:border-white/20 dark:hover:shadow-black/50"
            >
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-black/10 bg-white/70 text-purple-600 shadow-sm transition-colors dark:border-white/10 dark:bg-white/5 dark:text-purple-200">
                  <Plus className="size-8" />
                </div>
                <p className="text-lg font-medium text-foreground">
                  Crear nuevo curso
                </p>
              </div>
            </Card>
          }
        />
      )}
    </DashboardGrid>
  );
}
