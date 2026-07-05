import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchAllItineraries } from '@/features/itinerary/queries';
import { fetchAllSubjects } from '@/features/subject/queries';
import { fetchPaginatedSchedules } from '@/features/schedule/queries';
import { fetchAcademicYears } from '@/features/academic-year/queries';
import {
  fetchScheduleTimeConfigs,
  fetchTimeConfigPossibilities,
} from '@/features/schedule-time-config/queries';
import { ScheduleGenerator } from '@/features/schedule/components/schedule-generator';
import { ScheduleImporter } from '@/features/schedule/components/schedule-importer';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceActions } from '@/components/shared/resource/resource-actions';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import { ResourceFilterSelect } from '@/components/shared/resource/resource-filter-select';
import { ResourceLayout } from '@/components/shared/resource/resource-layout';
import { ResourceViewToggle } from '@/components/shared/resource/resource-view-toggle';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { fetchPaginatedSchedulesAction } from '@/features/schedule/actions';
import { ScheduleCard } from '@/features/schedule/components/schedule-card';
import { ScheduleRow } from '@/features/schedule/components/schedule-row';
import type { ScheduleListQueryDTO } from '@tfg-horarios/shared';
import { getSessionUser } from '@/features/auth/queries';
import { getOrganizationMemberRole } from '@/features/members/queries';
import {
  parseOptionalNumberParam,
  parsePositiveIntParam,
} from '@/lib/utils/search-params';

type ConflictFilter = NonNullable<ScheduleListQueryDTO['hasConflicts']>;

const conflictFilterValues: ConflictFilter[] = [
  'all',
  'conflicts',
  'unassigned',
  'conflictsAndUnassigned',
  'withoutConflictsAndUnassigned',
];

type OrganizationSchedulesPageProps = {
  params: Promise<{ id: string; academicYearId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationSchedulesPage({
  params,
  searchParams,
}: OrganizationSchedulesPageProps) {
  const { id, academicYearId } = await params;
  const cookieStore = await cookies();
  const viewCookie = cookieStore.get('view-schedules')?.value;
  const limitCookie = cookieStore.get('table-limit')?.value;
  const defaultTableLimit = parsePositiveIntParam(limitCookie, 8) ?? 8;
  const rawSearchParams = await searchParams;

  const currentView =
    rawSearchParams.view === 'table' || rawSearchParams.view === 'grid'
      ? rawSearchParams.view
      : viewCookie === 'table'
        ? 'table'
        : 'grid';

  const query: ScheduleListQueryDTO & { view?: string } = {
    view: currentView,
    page: parsePositiveIntParam(rawSearchParams.page, 1) ?? 1,
    limit:
      parsePositiveIntParam(rawSearchParams.limit) ??
      (currentView === 'table' ? defaultTableLimit : 12),
    academicYearId,
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
    courseYear: parseOptionalNumberParam(rawSearchParams.courseYear),
    period: parseOptionalNumberParam(rawSearchParams.period),
    status:
      typeof rawSearchParams.status === 'string' &&
      (rawSearchParams.status === 'draft' ||
        rawSearchParams.status === 'published')
        ? rawSearchParams.status
        : undefined,
    hasConflicts:
      typeof rawSearchParams.hasConflicts === 'string' &&
      conflictFilterValues.includes(
        rawSearchParams.hasConflicts as ConflictFilter
      )
        ? (rawSearchParams.hasConflicts as ConflictFilter)
        : undefined,
  };

  const t = await getTranslations('Organizations.schedules');
  const tSubjects = await getTranslations('Organizations.subjects');

  const [
    organization,
    historicalDegrees,
    historicalItineraries,
    historicalSubjects,
    academicYears,
    { data: schedules, meta },
    timeConfigs,
    timeConfigPossibilities,
    user,
  ] = await Promise.all([
    fetchOrganizationById(id),
    fetchAllDegrees(id, academicYearId),
    fetchAllItineraries(id, academicYearId),
    fetchAllSubjects(id, academicYearId),
    fetchAcademicYears(id),
    fetchPaginatedSchedules(id, query),
    fetchScheduleTimeConfigs(id, academicYearId).catch(() => []),
    fetchTimeConfigPossibilities(id, academicYearId).catch(() => []),
    getSessionUser(),
  ]);

  const memberRole = user ? await getOrganizationMemberRole(id) : null;
  const isAdmin = memberRole === 'admin';
  const isEditor = memberRole === 'editor';
  const canGenerate = isAdmin || isEditor;
  const canUpdate = isAdmin || isEditor;
  const canDelete = isAdmin;
  const canSeeConflicts = isAdmin || isEditor;

  if (!organization) {
    notFound();
  }

  const activeDegrees = historicalDegrees.filter((degree) => !degree.deletedAt);
  const activeItineraries = historicalItineraries.filter(
    (itinerary) => !itinerary.deletedAt
  );
  const activeSubjects = historicalSubjects.filter(
    (subject) => !subject.deletedAt
  );

  const degreeMap = historicalDegrees.reduce(
    (acc, d) => {
      acc[d.id] = `${d.name}${d.deletedAt ? ' (eliminado)' : ''}`;
      return acc;
    },
    {} as Record<string, string>
  );
  const itineraryMap = historicalItineraries.reduce(
    (acc, i) => {
      acc[i.id] = `${i.code}${i.deletedAt ? ' (eliminado)' : ''}`;
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
    published: t('published'),
    draft: t('draft'),
    viewPlanner: 'View Planner',
    academicYear: 'Academic Year',
    course: 'Course',
    period: 'Period',
    shift: 'Shift',
    globalItinerary: 'Global',
    itinerary: tSubjects('itineraryPlaceholder'),
    common: tSubjects('common'),
  };

  const currentAcademicYear = academicYears.find(
    (ay) => ay.id === academicYearId
  );
  const courseYears =
    activeSubjects.length > 0
      ? Array.from(new Set(activeSubjects.map((s) => s.courseYear))).sort(
          (a, b) => a - b
        )
      : [1, 2, 3, 4];

  const periodType = currentAcademicYear?.periodType || 'semester';
  const showPeriodFilter = periodType !== 'annual';
  const periodOptions =
    periodType === 'trimester'
      ? [
          { label: 'Trimestre 1', value: '1' },
          { label: 'Trimestre 2', value: '2' },
          { label: 'Trimestre 3', value: '3' },
        ]
      : [
          { label: 'Semestre 1', value: '1' },
          { label: 'Semestre 2', value: '2' },
        ];

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title', { organization: organization.name })}
      description={t('description')}
      count={meta.total}
      countLabel={t('countLabel')}
    >
      <ResourceToolbar
        viewToggle={
          <ResourceViewToggle
            viewKey="view-schedules"
            defaultView={query.view as 'grid' | 'table'}
          />
        }
        filters={
          <>
            <ResourceFilterSelect
              paramKey="degreeId"
              placeholder={t('degreePlaceholder')}
              options={activeDegrees.map((d) => ({
                label: d.name,
                value: d.id,
              }))}
              searchable={true}
            />
            <ResourceFilterSelect
              paramKey="itineraryId"
              placeholder={t('itineraryPlaceholder')}
              options={[
                { label: t('itineraryOptions.common'), value: 'common' },
                ...activeItineraries.map((i) => ({
                  label: i.name,
                  value: i.id,
                })),
              ]}
              searchable={true}
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
              options={courseYears.map((c) => ({
                label: `${c}º`,
                value: c.toString(),
              }))}
            />
            {showPeriodFilter && (
              <ResourceFilterSelect
                paramKey="period"
                placeholder={t('period')}
                clearLabel="Todos"
                options={periodOptions}
              />
            )}
            <ResourceFilterSelect
              paramKey="status"
              placeholder={t('statusLabel')}
              options={[
                { label: t('draft'), value: 'draft' },
                { label: t('published'), value: 'published' },
              ]}
            />
            {canSeeConflicts && (
              <ResourceFilterSelect
                paramKey="hasConflicts"
                placeholder={t('conflictsLabel')}
                clearLabel={t('all')}
                options={[
                  { label: t('withConflicts'), value: 'conflicts' },
                  { label: t('withUnassigned'), value: 'unassigned' },
                  {
                    label: t('withConflictsAndUnassigned'),
                    value: 'conflictsAndUnassigned',
                  },
                  {
                    label: t('withoutConflictsAndUnassigned'),
                    value: 'withoutConflictsAndUnassigned',
                  },
                ]}
              />
            )}
            <ResourceFilterClear />
          </>
        }
        actions={
          canGenerate && (
            <ResourceActions>
              <ScheduleImporter
                organizationId={id}
                academicYearId={academicYearId}
                academicYears={academicYears}
                degrees={historicalDegrees}
                itineraries={historicalItineraries}
              />
              <ScheduleGenerator
                organizationId={id}
                periodType={currentAcademicYear?.periodType || 'semester'}
                academicYearId={academicYearId}
                degrees={activeDegrees}
                itineraries={activeItineraries}
                subjects={activeSubjects}
                timeConfigs={timeConfigs}
                timeConfigPossibilities={timeConfigPossibilities}
              />
            </ResourceActions>
          )
        }
      />

      <div className="mt-6">
        <ResourceLayout
          view={query.view as 'grid' | 'table'}
          items={schedules}
          meta={meta}
          query={query}
          loadMore={fetchPaginatedSchedulesAction.bind(null, id, query)}
          emptyState={<ResourceEmptyState message={t('empty')} />}
          GridItemComponent={ScheduleCard}
          gridItemProps={{
            degreeMap,
            itineraryMap,
            academicYearMap,
            organizationId: id,
            translations,
            canUpdate,
            canDelete,
          }}
          tableHeaders={[
            'Estado',
            'Grado',
            'Itinerario',
            'Curso',
            'Período',
            'Turno',
            'Acciones',
          ]}
          TableRowComponent={ScheduleRow}
          tableRowProps={{
            degreeMap,
            itineraryMap,
            academicYearMap,
            organizationId: id,
            translations,
            canUpdate,
            canDelete,
          }}
        />
      </div>
    </OrganizationSectionShell>
  );
}
