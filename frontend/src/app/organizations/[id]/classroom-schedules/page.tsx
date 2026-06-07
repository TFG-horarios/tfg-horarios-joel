import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchAllClassrooms } from '@/features/classroom/queries';
import { fetchActiveClassroomConfigurations } from '@/features/classroom-schedule/queries';
import { fetchScheduleAcademicYears } from '@/features/schedule/queries';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceSearch } from '@/components/shared/resource/resource-search';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import { ResourceFilterSelect } from '@/components/shared/resource/resource-filter-select';
import { ResourceLayout } from '@/components/shared/resource/resource-layout';
import { ResourceViewToggle } from '@/components/shared/resource/resource-view-toggle';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { fetchActiveClassroomConfigurationsAction } from '@/features/classroom-schedule/actions';
import { ClassroomConfigurationCard } from '@/features/classroom-schedule/components/classroom-configuration-card';
import { ClassroomConfigurationRow } from '@/features/classroom-schedule/components/classroom-configuration-row';
import type {
  ClassroomConfigurationListQueryDTO,
  AcademicYear,
} from '@tfg-horarios/shared';

type OrganizationClassroomSchedulesPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationClassroomSchedulesPage({
  params,
  searchParams,
}: OrganizationClassroomSchedulesPageProps) {
  const { id } = await params;
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
    academicYear:
      typeof rawSearchParams.academicYear === 'string'
        ? (rawSearchParams.academicYear as AcademicYear)
        : undefined,
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
  };

  const t = await getTranslations('Organizations.classroomSchedules');
  const tStatus = await getTranslations('Organizations.schedules');

  const [
    organization,
    classrooms,
    academicYears,
    { data: configurations, meta },
  ] = await Promise.all([
    fetchOrganizationById(id),
    fetchAllClassrooms(id),
    fetchScheduleAcademicYears(id),
    fetchActiveClassroomConfigurations(id, query),
  ]);

  if (!organization) {
    notFound();
  }

  const classroomMap = new Map(classrooms.map((c) => [c.id, c.name]));
  const academicYearOptions = academicYears.map((y) => ({
    label: y,
    value: y,
  }));

  const translations = {
    empty: t('empty'),
    academicYear: tStatus('form.academicYear'),
    period: tStatus('period'),
    shift: tStatus('shift'),
    shift_morning: t('shiftOptions.morning'),
    shift_afternoon: t('shiftOptions.afternoon'),
  };

  const numPeriods =
    organization.periodType === 'annual'
      ? 1
      : organization.periodType === 'trimester'
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
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 w-full pb-4 border-b border-border/50">
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
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <ResourceFilterSelect
                paramKey="academicYear"
                placeholder={tStatus('form.academicYear')}
                options={academicYearOptions}
              />
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
              <ResourceFilterClear />
            </div>
          }
        />
      </div>

      <div className="mt-6">
        <ResourceLayout
          view={query.view as 'grid' | 'table'}
          items={configurations}
          meta={meta}
          query={query}
          loadMore={fetchActiveClassroomConfigurationsAction.bind(
            null,
            id,
            query
          )}
          emptyState={<ResourceEmptyState message={t('empty')} />}
          GridItemComponent={ClassroomConfigurationCard}
          gridItemProps={{
            classroomMap,
            organizationId: id,
            translations,
          }}
          tableHeaders={[
            t('headers.classroom'),
            tStatus('form.academicYear'),
            tStatus('period'),
            tStatus('shift'),
            t('headers.actions'),
          ]}
          TableRowComponent={ClassroomConfigurationRow}
          tableRowProps={{
            classroomMap,
            organizationId: id,
            translations,
          }}
        />
      </div>
    </OrganizationSectionShell>
  );
}
