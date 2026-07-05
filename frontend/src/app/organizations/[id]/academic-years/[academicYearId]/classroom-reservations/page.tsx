import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchPaginatedReservations } from '@/features/classroom-reservation/queries';
import { fetchPaginatedReservationsAction } from '@/features/classroom-reservation/actions';
import { fetchAllClassrooms } from '@/features/classroom/queries';
import { fetchAcademicYears } from '@/features/academic-year/queries';
import { fetchAllMembers } from '@/features/members/queries';
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
import { type ClassroomDTO } from '@tfg-horarios/shared';
import { parsePositiveIntParam } from '@/lib/utils/search-params';
import { getTranslations } from 'next-intl/server';

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
  const defaultTableLimit = parsePositiveIntParam(limitCookie, 8) ?? 8;
  const rawSearchParams = await searchParams;

  const currentView =
    rawSearchParams.view === 'table' || rawSearchParams.view === 'grid'
      ? rawSearchParams.view
      : viewCookie === 'table'
        ? 'table'
        : 'grid';

  const query = {
    view: currentView,
    page: parsePositiveIntParam(rawSearchParams.page, 1) ?? 1,
    limit:
      parsePositiveIntParam(rawSearchParams.limit) ??
      (currentView === 'table' ? defaultTableLimit : 12),
    status:
      typeof rawSearchParams.status === 'string' &&
      ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'].includes(
        rawSearchParams.status
      )
        ? (rawSearchParams.status as
            | 'PENDING'
            | 'ACCEPTED'
            | 'REJECTED'
            | 'CANCELLED')
        : undefined,
    academicYearId,
  };

  const [
    organization,
    { data: reservations, meta },
    classroomsData,
    user,
    academicYears,
  ] = await Promise.all([
    fetchOrganizationById(id),
    fetchPaginatedReservations(id, query),
    fetchAllClassrooms(id, academicYearId),
    getSessionUser(),
    fetchAcademicYears(id),
  ]);
  const t = await getTranslations('Organizations.classroomReservations');

  if (!organization) {
    notFound();
  }

  const role = user ? await getOrganizationMemberRole(id) : null;
  const isAdminOrEditor = role === 'admin' || role === 'editor';

  let membersMap: Record<string, string> = {};
  if (isAdminOrEditor) {
    try {
      const members = await fetchAllMembers(id);
      membersMap = members.reduce(
        (acc, m) => {
          acc[m.userId] = m.userEmail;
          return acc;
        },
        {} as Record<string, string>
      );
    } catch (e) {
      console.error('Failed to fetch members for reservations map', e);
    }
  }

  const currentAcademicYear = academicYears.find(
    (ay) => ay.id === academicYearId
  );

  const classroomsMap = classroomsData.reduce(
    (acc: Record<string, string>, classroom: ClassroomDTO) => {
      acc[classroom.id] = classroom.name;
      return acc;
    },
    {} as Record<string, string>
  );

  const translations = {
    empty: t('empty'),
    'status.PENDING': t('status.PENDING'),
    'status.ACCEPTED': t('status.ACCEPTED'),
    'status.REJECTED': t('status.REJECTED'),
    'status.CANCELLED': t('status.CANCELLED'),
    statusUpdateSuccess_ACCEPTED: t('statusUpdateSuccess.ACCEPTED'),
    statusUpdateSuccess_REJECTED: t('statusUpdateSuccess.REJECTED'),
    statusUpdateSuccess_CANCELLED: t('statusUpdateSuccess.CANCELLED'),
    statusUpdateError: t('statusUpdateError'),
    cancelError: t('cancelError'),
    cancelTitle: t('cancelTitle'),
    cancelDescription: t('cancelDescription'),
    'action.accept': t('actions.accept'),
    'action.reject': t('actions.reject'),
    'action.cancel': t('actions.cancel'),
    'requester.self': t('requester.self'),
    'requester.unknown': t('requester.unknown'),
    'requester.label': t('requester.label'),
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
      label={t('label')}
      title={t('title')}
      description={t('description')}
      count={meta.total}
      countLabel={t('countLabel')}
    >
      <ResourceToolbar
        viewToggle={
          <ResourceViewToggle
            viewKey="view-classroom-reservations"
            defaultView={query.view as 'grid' | 'table'}
          />
        }
        filters={
          <>
            <ResourceFilterSelect
              paramKey="status"
              placeholder={t('statusLabel')}
              options={[
                { label: t('status.PENDING'), value: 'PENDING' },
                { label: t('status.ACCEPTED'), value: 'ACCEPTED' },
                { label: t('status.REJECTED'), value: 'REJECTED' },
              ]}
            />
            <ResourceFilterClear />
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    size="icon"
                    className="size-9 cursor-pointer bg-brand-purple-bg text-brand-purple border border-brand-purple-border hover:bg-brand-purple-hover dark:hover:bg-brand-purple-hover"
                  >
                    <Link
                      href={`/organizations/${id}/academic-years/${academicYearId}/classroom-reservations/new`}
                      aria-label={t('actions.create')}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">{t('actions.create')}</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('actions.create')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        }
      />
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
            memberRole: role || null,
            currentUserId: user?.id,
            membersMap,
            academicYear: currentAcademicYear,
          }}
          tableHeaders={[
            t('headers.status'),
            t('headers.classroom'),
            t('headers.date'),
            t('headers.schedule'),
            ...(isAdminOrEditor ? [t('headers.requester')] : []),
            t('headers.reason'),
            t('headers.actions'),
          ]}
          TableRowComponent={ClassroomReservationRow}
          tableRowProps={{
            translations,
            classrooms: classroomsMap,
            memberRole: role || null,
            currentUserId: user?.id,
            membersMap,
            academicYear: currentAcademicYear,
          }}
        />
      </div>
    </OrganizationSectionShell>
  );
}
