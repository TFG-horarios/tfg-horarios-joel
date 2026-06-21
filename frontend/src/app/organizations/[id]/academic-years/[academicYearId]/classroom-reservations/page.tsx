import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchPaginatedReservations } from '@/features/classroom-reservation/queries';
import { fetchPaginatedReservationsAction } from '@/features/classroom-reservation/actions';
import { fetchAllClassrooms } from '@/features/classroom/queries';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceFilterSelect } from '@/components/shared/resource/resource-filter-select';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import { ResourceViewToggle } from '@/components/shared/resource/resource-view-toggle';
import { ResourceLayout } from '@/components/shared/resource/resource-layout';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { ClassroomReservationCard } from '@/features/classroom-reservation/components/classroom-reservation-card';
import { ClassroomReservationRow } from '@/features/classroom-reservation/components/classroom-reservation-row';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getSessionUser } from '@/features/auth/queries';
import { getOrganizationMemberRole } from '@/features/members/queries';
import { hasPermission } from '@/core/permissions/authorization';
import { type ClassroomDTO } from '@tfg-horarios/shared';

type OrganizationClassroomReservationsPageProps = {
  params: Promise<{ id: string; academicYearId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationClassroomReservationsPage({
  params,
  searchParams,
}: OrganizationClassroomReservationsPageProps) {
  const { id, academicYearId } = await params;
  const cookieStore = await cookies();
  const viewCookie = cookieStore.get('view-classroom-reservations')?.value;
  const limitCookie = cookieStore.get('table-limit')?.value;
  const defaultTableLimit = limitCookie ? parseInt(limitCookie, 10) : 8;
  const rawSearchParams = await searchParams;

  const currentView =
    rawSearchParams.view === 'table' || rawSearchParams.view === 'grid'
      ? rawSearchParams.view
      : viewCookie === 'table'
        ? 'table'
        : 'grid';

  const query = {
    view: currentView,
    page: rawSearchParams.page ? Number(rawSearchParams.page) : 1,
    limit: rawSearchParams.limit
      ? Number(rawSearchParams.limit)
      : currentView === 'table'
        ? defaultTableLimit
        : 12,
    status:
      typeof rawSearchParams.status === 'string' &&
      ['PENDING', 'ACCEPTED', 'REJECTED'].includes(rawSearchParams.status)
        ? (rawSearchParams.status as 'PENDING' | 'ACCEPTED' | 'REJECTED')
        : undefined,
    academicYearId,
  };

  const [organization, { data: reservations, meta }, classroomsData, user] =
    await Promise.all([
      fetchOrganizationById(id),
      fetchPaginatedReservations(id, query),
      fetchAllClassrooms(id),
      getSessionUser(),
    ]);

  if (!organization) {
    notFound();
  }

  const role = user ? await getOrganizationMemberRole(id, user.id) : null;
  const canManage = role
    ? hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS')
    : false;

  const classroomsMap = classroomsData.reduce(
    (acc: Record<string, string>, classroom: ClassroomDTO) => {
      acc[classroom.id] = classroom.name;
      return acc;
    },
    {} as Record<string, string>
  );

  const translations = {
    empty: 'No hay reservas',
    'status.PENDING': 'Pendiente',
    'status.ACCEPTED': 'Aceptada',
    'status.REJECTED': 'Rechazada',
    statusUpdateSuccess_ACCEPTED: 'Reserva aceptada correctamente',
    statusUpdateSuccess_REJECTED: 'Reserva rechazada correctamente',
    statusUpdateError: 'Error al actualizar la reserva',
    'action.accept': 'Aceptar',
    'action.reject': 'Rechazar',
    'slot.0': '1ª',
    'slot.1': '2ª',
    'slot.2': '3ª',
    'slot.3': '4ª',
    'slot.4': '5ª',
    'slot.5': '6ª',
    'slot.6': '7ª',
    'slot.7': '8ª',
  };

  return (
    <OrganizationSectionShell
      label="Gestión de Espacios"
      title="Reservas de Aula"
      description="Gestiona las solicitudes y reservas de espacios de la organización."
      count={meta.total}
      countLabel="reservas"
    >
      <div className="flex-none flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full pb-4 border-b border-border/50">
        <ResourceToolbar
          viewToggle={
            <ResourceViewToggle
              viewKey="view-classroom-reservations"
              defaultView={query.view as 'grid' | 'table'}
            />
          }
          filters={
            <div className="flex gap-2 w-full">
              <ResourceFilterSelect
                paramKey="status"
                placeholder="Estado"
                options={[
                  { label: 'Pendiente', value: 'PENDING' },
                  { label: 'Aceptada', value: 'ACCEPTED' },
                  { label: 'Rechazada', value: 'REJECTED' },
                ]}
              />
              <ResourceFilterClear />
            </div>
          }
        />
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  size="icon"
                  className="size-9 cursor-pointer bg-purple-500/15 text-purple-700 border border-purple-500/40 hover:bg-purple-500/25 dark:bg-purple-500/20 dark:text-purple-200 dark:border-purple-500/30 dark:hover:bg-purple-500/30"
                >
                  <Link
                    href={`/organizations/${id}/academic-years/${academicYearId}/classroom-reservations/new`}
                    aria-label="Nueva Reserva"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Nueva Reserva</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Nueva Reserva</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div>
        <ResourceLayout
          view={query.view as 'grid' | 'table'}
          items={reservations}
          meta={meta}
          query={query}
          loadMore={fetchPaginatedReservationsAction.bind(null, id, query)}
          emptyState={<ResourceEmptyState message={translations.empty} />}
          GridItemComponent={ClassroomReservationCard}
          gridItemProps={{
            translations,
            classrooms: classroomsMap,
            canManage,
            currentUserId: user?.id,
          }}
          tableHeaders={[
            'Aula',
            'Fecha',
            'Slot',
            'Motivo',
            'Estado',
            'Acciones',
          ]}
          TableRowComponent={ClassroomReservationRow}
          tableRowProps={{
            translations,
            classrooms: classroomsMap,
            canManage,
            currentUserId: user?.id,
          }}
        />
      </div>
    </OrganizationSectionShell>
  );
}
