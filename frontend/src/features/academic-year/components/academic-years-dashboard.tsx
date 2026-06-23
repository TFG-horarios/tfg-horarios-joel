'use client';

import { useSearchParams } from 'next/navigation';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AcademicYearFormModal } from './academic-year-form-modal';
import {
  type AcademicYearDTO,
  type OrganizationDTO,
} from '@tfg-horarios/shared';
import { AcademicYearCard } from './academic-year-card';
import { DashboardGrid } from '@/components/layout/dashboard-grid';
import { useState, Suspense } from 'react';

type AcademicYearsDashboardProps = {
  initialAcademicYears: AcademicYearDTO[];
  memberRole: string | null;
  organization: OrganizationDTO;
};

function DashboardContent({
  initialAcademicYears,
  memberRole,
  organization,
  searchQuery,
}: AcademicYearsDashboardProps & { searchQuery: string }) {
  const [editingAcademicYear, setEditingAcademicYear] =
    useState<AcademicYearDTO | null>(null);

  const canCreate = memberRole === 'admin' || memberRole === 'editor';
  const canEdit = memberRole === 'admin' || memberRole === 'editor';
  const canDelete = memberRole === 'admin';

  const academicYears = initialAcademicYears;
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
    <div className="space-y-4">
      <div>
        <Button
          variant="ghost"
          asChild
          className="pl-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
        >
          <Link href="/organizations">
            <ArrowLeft className="mr-2 size-4" />
            Volver
          </Link>
        </Button>
      </div>
      <DashboardGrid
        title="Cursos Académicos"
        countLabel={academicYearCountLabel}
        description="Selecciona un curso académico para gestionar sus horarios y configuración."
        actionButton={
          canCreate ? (
            <AcademicYearFormModal
              organization={organization}
              trigger={
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        className="size-11 shrink-0 cursor-pointer bg-brand-purple-bg text-brand-purple border border-brand-purple-border hover:bg-brand-purple-hover dark:hover:bg-brand-purple-hover shadow-lg shadow-brand-purple/10 dark:shadow-black/20"
                        aria-label="Crear curso"
                      >
                        <Plus className="size-5" />
                        <span className="sr-only">Crear curso</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Crear curso</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              }
            />
          ) : undefined
        }
      >
        {filteredAcademicYears.map((ay) => (
          <AcademicYearCard
            key={ay.id}
            organizationId={organization.id}
            academicYear={ay}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={() => setEditingAcademicYear(ay)}
          />
        ))}

        {canCreate && (
          <AcademicYearFormModal
            organization={organization}
            trigger={
              <Card
                role="button"
                tabIndex={0}
                className="group h-full min-h-[10.5rem] cursor-pointer bg-card text-card-foreground border border-border p-6 transition-all duration-300 hover:border-brand-purple-border rounded-xl"
              >
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex size-16 items-center justify-center rounded-full border border-black/10 bg-white/70 text-brand-purple-solid transition-colors group-hover:border-brand-purple-border dark:group-hover:border-brand-purple-border dark:border-white/10 dark:bg-white/5">
                    <Plus className="size-8" />
                  </div>
                </div>
              </Card>
            }
          />
        )}

        {editingAcademicYear && (
          <AcademicYearFormModal
            organization={organization}
            academicYear={editingAcademicYear}
            trigger={<div style={{ display: 'none' }} />}
            defaultOpen={true}
            onOpenChange={(open) => {
              if (!open) setEditingAcademicYear(null);
            }}
          />
        )}
      </DashboardGrid>
    </div>
  );
}

function DashboardWithSearch(props: AcademicYearsDashboardProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') ?? '';
  return <DashboardContent {...props} searchQuery={searchQuery} />;
}

export function AcademicYearsDashboard(props: AcademicYearsDashboardProps) {
  return (
    <Suspense fallback={<DashboardContent {...props} searchQuery="" />}>
      <DashboardWithSearch {...props} />
    </Suspense>
  );
}
