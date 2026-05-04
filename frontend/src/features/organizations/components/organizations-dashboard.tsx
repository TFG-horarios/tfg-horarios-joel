'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateOrganizationForm } from './create-organization-form';
import { type Organization } from '@/types/organization';
import { useOrganizationStore } from '@/store/use-organization-store';

type OrganizationsDashboardProps = {
  initialOrganizations: Organization[];
  initialError?: string | null;
};

export function OrganizationsDashboard({
  initialOrganizations,
  initialError = null,
}: OrganizationsDashboardProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const selectOrganization = useOrganizationStore(
    (state) => state.selectOrganization
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const organizations = initialOrganizations;
  const error = initialError;

  const handleSelectOrganization = (orgId: string) => {
    selectOrganization(orgId);
    router.push(`/organizations/${orgId}`);
  };

  return (
    <div className="space-y-8">
      <>
        <div className="mb-8 mt-2 flex flex-col justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <Building2 className="size-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Tus organizaciones
              </h2>
              {/* Contador estilo Badge integrado */}
              <span className="flex items-center justify-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-300">
                {organizations.length}
                {organizations.length !== 1 && ' organizaciones'}
                {organizations.length === 1 && ' organización'}
              </span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Selecciona una organización para gestionar sus horarios
              académicos.
            </p>
          </div>

          {/* Botón de crear */}
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-11 shrink-0 cursor-pointer bg-violet-600 px-5 text-white shadow-lg shadow-violet-900/20 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700"
          >
            <Plus className="mr-2 size-4" />
            Crear organización
          </Button>
        </div>

        {/* Manejo de errores */}
        {error && (
          <Card className="border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </Card>
        )}

        {/* Grid de tarjetas */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="group cursor-pointer p-6 transition-all duration-300 hover:border-violet-300 hover:shadow-lg dark:hover:border-violet-400 dark:hover:shadow-violet-900/30"
              onClick={() => handleSelectOrganization(org.id)}
            >
              <h3 className="mb-3 text-xl font-semibold text-zinc-900 transition-colors group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-400">
                {org.name}
              </h3>

              <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-300">
                    Tipo de período:
                  </span>{' '}
                  {org.periodType}
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-300">
                    Mañana:
                  </span>{' '}
                  {org.morningStart} - {org.morningEnd}
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-300">
                    Tarde:
                  </span>{' '}
                  {org.afternoonStart} - {org.afternoonEnd}
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-300">
                    Duración del slot:
                  </span>{' '}
                  {org.slotDurationMinutes} min
                </p>
              </div>
            </Card>
          ))}

          {/* Tarjeta / Trigger del Modal */}
          {mounted ? (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Card
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setIsModalOpen(true);
                    }
                  }}
                  className="group h-full min-h-48 cursor-pointer border-2 border-dashed border-zinc-300/80 bg-transparent p-6 transition-all duration-300 hover:border-violet-400 hover:shadow-lg dark:border-zinc-700/80 dark:hover:border-violet-500"
                >
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 shadow-sm transition-colors group-hover:border-violet-400 group-hover:bg-violet-50 group-hover:text-violet-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:group-hover:border-violet-500 dark:group-hover:bg-violet-950/30 dark:group-hover:text-violet-300">
                      <Plus className="size-8" />
                    </div>
                    <p className="text-lg font-medium text-zinc-900 dark:text-white">
                      Crear nueva organización
                    </p>
                  </div>
                </Card>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md lg:max-w-lg lg:p-8">
                <DialogHeader>
                  <DialogTitle>Nueva organización</DialogTitle>
                  <DialogDescription>
                    Configura los parámetros básicos de tu organización
                  </DialogDescription>
                </DialogHeader>

                <CreateOrganizationForm
                  onSuccess={() => {
                    setIsModalOpen(false);
                    router.refresh();
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <Card className="group h-full min-h-48 cursor-pointer border-2 border-dashed border-zinc-300/80 bg-transparent p-6 transition-all duration-300 hover:border-violet-400 hover:shadow-lg dark:border-zinc-700/80 dark:hover:border-violet-500">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 shadow-sm transition-colors group-hover:border-violet-400 group-hover:bg-violet-50 group-hover:text-violet-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:group-hover:border-violet-500 dark:group-hover:bg-violet-950/30 dark:group-hover:text-violet-300">
                  <Plus className="size-8" />
                </div>
                <p className="text-lg font-medium text-zinc-900 dark:text-white">
                  Crear nueva organización
                </p>
              </div>
            </Card>
          )}
        </div>
      </>
    </div>
  );
}
