import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchAllItineraries } from '@/features/itinerary/queries';
import { fetchSchedules } from '@/features/schedule/queries';
import { ScheduleGenerator } from '@/features/schedule/components/schedule-generator';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceActions } from '@/components/shared/resource/resource-actions';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import { ResourceFilterSelect } from '@/components/shared/resource/resource-filter-select';
import { ResourceLayout } from '@/components/shared/resource/resource-layout';
import { ResourceViewToggle } from '@/components/shared/resource/resource-view-toggle';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { fetchSchedulesAction } from '@/features/schedule/actions';
import { ScheduleCard } from '@/features/schedule/components/schedule-card';
import { ScheduleRow } from '@/features/schedule/components/schedule-row';
import type { ScheduleListQueryDTO } from '@tfg-horarios/shared';

type OrganizationSchedulesPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationSchedulesPage({
  params,
  searchParams,
}: OrganizationSchedulesPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const viewCookie = cookieStore.get('view-schedules')?.value;
  const limitCookie = cookieStore.get('table-limit')?.value;
  const defaultTableLimit = limitCookie ? parseInt(limitCookie, 10) : 8;
  const rawSearchParams = await searchParams;
  
  const currentView = rawSearchParams.view === 'table' || rawSearchParams.view === 'grid' 
    ? rawSearchParams.view 
    : (viewCookie === 'table' ? 'table' : 'grid');

  const query: ScheduleListQueryDTO & { view?: string } = {
    view: currentView,
    page: rawSearchParams.page ? Number(rawSearchParams.page) : 1,
    limit: rawSearchParams.limit ? Number(rawSearchParams.limit) : (currentView === 'table' ? defaultTableLimit : 12),
    degreeId:
      typeof rawSearchParams.degreeId === 'string'
        ? rawSearchParams.degreeId
        : undefined,
    itineraryId:
      typeof rawSearchParams.itineraryId === 'string'
        ? rawSearchParams.itineraryId
        : undefined,
    shift:
      typeof rawSearchParams.shift === 'string' &&
      (rawSearchParams.shift === 'morning' ||
        rawSearchParams.shift === 'afternoon')
        ? rawSearchParams.shift
        : undefined,
    courseYear:
      typeof rawSearchParams.courseYear === 'string'
        ? parseInt(rawSearchParams.courseYear, 10)
        : undefined,
    period:
      typeof rawSearchParams.period === 'string'
        ? parseInt(rawSearchParams.period, 10)
        : undefined,
    status:
      typeof rawSearchParams.status === 'string' &&
      (rawSearchParams.status === 'draft' ||
        rawSearchParams.status === 'published' ||
        rawSearchParams.status === 'archived')
        ? rawSearchParams.status
        : undefined,
  };

  const t = await getTranslations('Organizations.schedules');
  const organization = await fetchOrganizationById(id);

  if (!organization) {
    notFound();
  }

  const [degrees, itineraries, { data: schedules, meta }] = await Promise.all([
    fetchAllDegrees(id),
    fetchAllItineraries(id),
    fetchSchedules(id, query),
  ]);

  const degreeMap = new Map(degrees.map((d) => [d.id, d.name]));
  const itineraryMap = new Map(itineraries.map((i) => [i.id, i.code]));

  const translations = {
    empty: t('empty'),
    published: t('published'),
    draft: t('draft'),
    archived: t('archived'),
    viewPlanner: 'View Planner',
    academicYear: 'Academic Year',
    course: 'Course',
    period: 'Period',
    shift: 'Shift',
    globalItinerary: 'Global',
  };

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title', { organization: organization.name })}
      description={t('description')}
      count={meta.total}
      countLabel={t('countLabel')}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 w-full pb-4 border-b border-border/50">
        <ResourceToolbar
          viewToggle={<ResourceViewToggle viewKey="view-schedules" defaultView={query.view as 'grid' | 'table'} />}
          filters={
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <ResourceFilterSelect
                paramKey="degreeId"
                placeholder={t('degreePlaceholder')}
                options={degrees.map((d) => ({ label: d.name, value: d.id }))}
              />
              <ResourceFilterSelect
                paramKey="itineraryId"
                placeholder={t('itineraryPlaceholder')}
                options={[
                  { label: t('itineraryOptions.common'), value: 'common' },
                  ...itineraries.map((i) => ({ label: i.name, value: i.id })),
                ]}
              />
              <ResourceFilterSelect
                paramKey="shift"
                placeholder={t('shift')}
                options={[
                  { label: t('shiftOptions.morning'), value: 'morning' },
                  { label: t('shiftOptions.afternoon'), value: 'afternoon' },
                ]}
              />
              <ResourceFilterSelect
                paramKey="courseYear"
                placeholder={t('courseYear')}
                options={[
                  { label: '1º', value: '1' },
                  { label: '2º', value: '2' },
                  { label: '3º', value: '3' },
                  { label: '4º', value: '4' },
                  { label: '5º', value: '5' },
                  { label: '6º', value: '6' },
                ]}
              />
              <ResourceFilterSelect
                paramKey="period"
                placeholder={t('period')}
                options={[
                  { label: t('periodOptions.1'), value: '1' },
                  { label: t('periodOptions.2'), value: '2' },
                  { label: t('periodOptions.3'), value: '3' },
                ]}
              />
              <ResourceFilterSelect
                paramKey="status"
                placeholder={t('statusLabel')}
                options={[
                  { label: t('draft'), value: 'draft' },
                  { label: t('published'), value: 'published' },
                  { label: t('archived'), value: 'archived' },
                ]}
              />
              <ResourceFilterClear />
            </div>
          }
        />
        <ResourceActions>
          <ScheduleGenerator
            organizationId={id}
            degrees={degrees}
            itineraries={itineraries}
          />
        </ResourceActions>
      </div>

      <div className="mt-6">
        <ResourceLayout
          view={query.view as 'grid' | 'table'}
          items={schedules}
          meta={meta}
          query={query}
          loadMore={fetchSchedulesAction.bind(null, id, query)}
          emptyState={<ResourceEmptyState message={t('empty')} />}
          GridItemComponent={ScheduleCard}
          gridItemProps={{
            degreeMap,
            itineraryMap,
            organizationId: id,
            translations,
          }}
          tableHeaders={['Estado', 'Titulación', 'Itinerario', 'Año', 'Curso', 'Período', 'Turno', 'Acciones']}
          TableRowComponent={ScheduleRow}
          tableRowProps={{
            degreeMap,
            itineraryMap,
            organizationId: id,
            translations,
          }}
        />
      </div>
    </OrganizationSectionShell>
  );
}
