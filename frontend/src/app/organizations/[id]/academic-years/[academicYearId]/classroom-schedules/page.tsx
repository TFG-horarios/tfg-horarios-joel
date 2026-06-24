import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchAllClassrooms } from '@/features/classroom/queries';
import { fetchAcademicYears } from '@/features/academic-year/queries';
import { fetchPaginatedActiveClassroomConfigurations } from '@/features/classroom-schedule/queries';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceSearch } from '@/components/shared/resource/resource-search';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import { ResourceFilterSelect } from '@/components/shared/resource/resource-filter-select';
import { ResourceLayout } from '@/components/shared/resource/resource-layout';
import { ResourceViewToggle } from '@/components/shared/resource/resource-view-toggle';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { fetchPaginatedActiveClassroomConfigurationsAction } from '@/features/classroom-schedule/actions';
import { ClassroomScheduleCard } from '@/features/classroom-schedule/components/classroom-schedule-card';
import { ClassroomScheduleRow } from '@/features/classroom-schedule/components/classroom-schedule-row';
import type { ClassroomConfigurationListQueryDTO } from '@tfg-horarios/shared';

type OrganizationClassroomSchedulesPageProps = {
  params: Promise<{ id: string; academicYearId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationClassroomSchedulesPage({
  params,
  searchParams,
}: OrganizationClassroomSchedulesPageProps) {
  const { id, academicYearId } = await params;
  const cookieStore = await cookies();
  const viewCookie = cookieStore.get('view-classroom-schedules')?.value;
  const limitCookie = cookieStore.get('table-limit')?.value;
  const defaultTableLimit = limitCookie ? parseInt(limitCookie, 10) : 8;
  const rawSearchParams = await searchParams;

  const currentView =
    rawSearchParams.view === 'table' || rawSearchParams.view === 'grid'
      ? rawSearchParams.view
      : viewCookie === 'table'
        ? 'table'
        : 'grid';

  const query: ClassroomConfigurationListQueryDTO & { view?: string } = {
    view: currentView,
    page: rawSearchParams.page ? Number(rawSearchParams.page) : 1,
    limit: rawSearchParams.limit
      ? Number(rawSearchParams.limit)
      : currentView === 'table'
        ? defaultTableLimit
        : 12,
    search:
      typeof rawSearchParams.q === 'string' ? rawSearchParams.q : undefined,
    academicYearId,
    shift:
      typeof rawSearchParams.shift === 'string' &&
      (rawSearchParams.shift === 'morning' ||
        rawSearchParams.shift === 'afternoon')
        ? rawSearchParams.shift
        : undefined,
    period:
      typeof rawSearchParams.period === 'string'
        ? parseInt(rawSearchParams.period, 10)
        : undefined,
    type:
      typeof rawSearchParams.type === 'string' &&
      (rawSearchParams.type === 'theory' ||
        rawSearchParams.type === 'lab' ||
        rawSearchParams.type === 'computer_lab')
        ? rawSearchParams.type
        : undefined,
  };

  const t = await getTranslations('Organizations.classroomSchedules');
  const tStatus = await getTranslations('Organizations.schedules');
  const tClassrooms = await getTranslations('Organizations.classrooms');

  const [
    organization,
    classrooms,
    academicYears,
    { data: configurations, meta },
  ] = await Promise.all([
    fetchOrganizationById(id),
    fetchAllClassrooms(id, academicYearId),
    fetchAcademicYears(id),
    fetchPaginatedActiveClassroomConfigurations(id, query),
  ]);

  if (!organization) {
    notFound();
  }

  const classroomMap = classrooms.reduce(
    (acc, c) => {
      acc[c.id] = `${c.name}${c.deletedAt ? ' (eliminada)' : ''}`;
      return acc;
    },
    {} as Record<string, string>
  );

  const academicYearMap = academicYears.reduce(
    (acc, ay) => {
      acc[ay.id] = ay.name;
      return acc;
    },
    {} as Record<string, string>
  );

  const translations = {
    empty: t('empty'),
    academicYear: tStatus('form.academicYear'),
    period: tStatus('period'),
    shift: tStatus('shift'),
    shift_morning: t('shiftOptions.morning'),
    shift_afternoon: t('shiftOptions.afternoon'),
  };

  const currentAcademicYear = academicYears.find(
    (ay) => ay.id === academicYearId
  );
  const numPeriods =
    currentAcademicYear?.periodType === 'annual'
      ? 1
      : currentAcademicYear?.periodType === 'trimester'
        ? 3
        : 2;
  const periodOptions = Array.from({ length: numPeriods }, (_, i) => {
    const p = String(i + 1);
    return { label: tStatus(`periodOptions.${p}`), value: p };
  });

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
            viewKey="view-classroom-schedules"
            defaultView={query.view as 'grid' | 'table'}
          />
        }
        search={
          <ResourceSearch
            placeholder={t('searchPlaceholder') || 'Buscar aula...'}
          />
        }
        filters={
          <>
            <ResourceFilterSelect
              paramKey="shift"
              placeholder={tStatus('shift')}
              options={[
                { label: t('shiftOptions.morning'), value: 'morning' },
                { label: t('shiftOptions.afternoon'), value: 'afternoon' },
              ]}
            />
            <ResourceFilterSelect
              paramKey="period"
              placeholder={tStatus('period')}
              options={periodOptions}
            />
            <ResourceFilterSelect
              paramKey="type"
              placeholder={tClassrooms('typeFilterLabel')}
              options={[
                { label: tClassrooms('types.theory'), value: 'theory' },
                { label: tClassrooms('types.lab'), value: 'lab' },
                {
                  label: tClassrooms('types.computer_lab'),
                  value: 'computer_lab',
                },
              ]}
            />
            <ResourceFilterClear />
          </>
        }
      />

      <div className="mt-6">
        <ResourceLayout
          view={query.view as 'grid' | 'table'}
          items={configurations}
          meta={meta}
          query={query}
          loadMore={fetchPaginatedActiveClassroomConfigurationsAction.bind(
            null,
            id,
            query
          )}
          emptyState={<ResourceEmptyState message={t('empty')} />}
          GridItemComponent={ClassroomScheduleCard}
          gridItemProps={{
            classroomMap,
            academicYearMap,
            organizationId: id,
            academicYearId,
            translations,
          }}
          tableHeaders={[
            t('headers.classroom'),
            tStatus('period'),
            tStatus('shift'),
            t('headers.actions'),
          ]}
          TableRowComponent={ClassroomScheduleRow}
          tableRowProps={{
            classroomMap,
            academicYearMap,
            organizationId: id,
            academicYearId,
            translations,
          }}
        />
      </div>
    </OrganizationSectionShell>
  );
}
