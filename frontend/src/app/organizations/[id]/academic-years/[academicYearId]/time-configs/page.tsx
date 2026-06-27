import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceViewToggle } from '@/components/shared/resource/resource-view-toggle';
import { ResourceFilterSelect } from '@/components/shared/resource/resource-filter-select';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import { fetchAcademicYears } from '@/features/academic-year/queries';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { getSessionUser } from '@/features/auth/queries';
import { getOrganizationMemberRole } from '@/features/members/queries';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import {
  fetchScheduleTimeConfigs,
  fetchTimeConfigPossibilities,
} from '@/features/schedule-time-config/queries';
import { TimeConfigManager } from '@/features/schedule-time-config/components/time-config-manager';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchAllItineraries } from '@/features/itinerary/queries';

type TimeConfigsPageProps = {
  params: Promise<{ id: string; academicYearId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function TimeConfigsPage({
  params,
  searchParams,
}: TimeConfigsPageProps) {
  const { id, academicYearId } = await params;
  const cookieStore = await cookies();
  const rawSearchParams = await searchParams;
  const viewCookie = cookieStore.get('view-time-configs')?.value;
  const currentView =
    rawSearchParams.view === 'table' || rawSearchParams.view === 'grid'
      ? rawSearchParams.view
      : viewCookie === 'table'
        ? 'table'
        : 'grid';

  const user = await getSessionUser();
  const role = user ? await getOrganizationMemberRole(id, user.id) : null;
  const isAdminOrEditor = role === 'admin' || role === 'editor';
  const t = await getTranslations('Organizations.timeConfigs');
  const tSubjects = await getTranslations('Organizations.subjects');

  const [
    organization,
    academicYears,
    configs,
    possibilities,
    allDegrees,
    allItineraries,
  ] = await Promise.all([
    fetchOrganizationById(id),
    fetchAcademicYears(id),
    fetchScheduleTimeConfigs(id, academicYearId).catch(() => []),
    fetchTimeConfigPossibilities(id, academicYearId).catch(() => []),
    fetchAllDegrees(id, academicYearId).catch(() => []),
    fetchAllItineraries(id, academicYearId).catch(() => []),
  ]);

  const academicYear = academicYears.find((ay) => ay.id === academicYearId);

  if (!organization || !academicYear) {
    notFound();
  }

  const activeDegrees = allDegrees.filter((degree) => !degree.deletedAt);
  const activeItineraries = allItineraries.filter(
    (itinerary) => !itinerary.deletedAt
  );
  const filteredPossibilities = possibilities.filter((possibility) => {
    const status = configs.some(
      (config) =>
        config.degreeId === possibility.degreeId &&
        config.itineraryId === possibility.itineraryId &&
        config.courseYear === possibility.courseYear &&
        config.period === possibility.period &&
        config.shift === possibility.shift
    )
      ? 'configured'
      : 'unconfigured';

    return (
      (!rawSearchParams.degreeId ||
        rawSearchParams.degreeId === possibility.degreeId) &&
      (!rawSearchParams.itineraryId ||
        (rawSearchParams.itineraryId === 'common'
          ? possibility.itineraryId === null
          : rawSearchParams.itineraryId === possibility.itineraryId)) &&
      (!rawSearchParams.courseYear ||
        Number(rawSearchParams.courseYear) === possibility.courseYear) &&
      (!rawSearchParams.period ||
        Number(rawSearchParams.period) === possibility.period) &&
      (!rawSearchParams.shift || rawSearchParams.shift === possibility.shift) &&
      (!rawSearchParams.status || rawSearchParams.status === status)
    );
  });
  const visibleKeys = new Set(
    filteredPossibilities.map((item) =>
      [
        item.degreeId,
        item.itineraryId ?? 'common',
        item.courseYear,
        item.period,
        item.shift,
      ].join(':')
    )
  );
  const filteredConfigs = configs.filter((config) =>
    visibleKeys.has(
      [
        config.degreeId,
        config.itineraryId ?? 'common',
        config.courseYear,
        config.period,
        config.shift,
      ].join(':')
    )
  );
  const translations = {
    common: tSubjects('itineraryOptions.common'),
    course: t('course'),
    period: t('period'),
    periodAnnual: tSubjects('periodOptions.annual'),
    period1: tSubjects('periodOptions.1'),
    period2: tSubjects('periodOptions.2'),
    period3: t('period3'),
    shiftMorning: tSubjects('shiftOptions.morning'),
    shiftAfternoon: tSubjects('shiftOptions.afternoon'),
    configured: t('status.configured'),
    unconfigured: t('status.unconfigured'),
    configure: t('configure'),
    edit: t('edit'),
    delete: t('delete'),
    startTime: t('startTime'),
    endTime: t('endTime'),
    break: t('break'),
    breakAfterSlot: t('breakAfterSlot'),
    noBreak: t('noBreak'),
    slots: t('slots'),
    save: t('save'),
    cancel: t('cancel'),
    empty: t('empty'),
    modalCreateTitle: t('modal.createTitle'),
    modalEditTitle: t('modal.editTitle'),
    modalDescription: t('modal.description'),
    success: t('success'),
    error: t('error'),
  };

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title')}
      description={t('description')}
      count={filteredPossibilities.length}
      countLabel={t('countLabel')}
    >
      <ResourceToolbar
        viewToggle={
          <ResourceViewToggle
            viewKey="view-time-configs"
            defaultView={currentView}
          />
        }
        filters={
          <>
            <ResourceFilterSelect
              paramKey="degreeId"
              placeholder={t('degreePlaceholder')}
              options={activeDegrees.map((degree) => ({
                label: degree.name,
                value: degree.id,
              }))}
              searchable
            />
            <ResourceFilterSelect
              paramKey="itineraryId"
              placeholder={t('itineraryPlaceholder')}
              options={[
                {
                  label: tSubjects('itineraryOptions.common'),
                  value: 'common',
                },
                ...activeItineraries.map((itinerary) => ({
                  label: itinerary.name,
                  value: itinerary.id,
                })),
              ]}
              searchable
            />
            <ResourceFilterSelect
              paramKey="courseYear"
              placeholder={t('coursePlaceholder')}
              options={[1, 2, 3, 4, 5, 6].map((course) => ({
                label: `${course}º`,
                value: String(course),
              }))}
            />
            <ResourceFilterSelect
              paramKey="period"
              placeholder={t('periodPlaceholder')}
              options={[0, 1, 2, 3].map((period) => ({
                label:
                  period === 0
                    ? tSubjects('periodOptions.annual')
                    : period === 3
                      ? t('period3')
                      : tSubjects(`periodOptions.${period}`),
                value: String(period),
              }))}
            />
            <ResourceFilterSelect
              paramKey="shift"
              placeholder={t('shiftPlaceholder')}
              options={[
                { label: tSubjects('shiftOptions.morning'), value: 'morning' },
                {
                  label: tSubjects('shiftOptions.afternoon'),
                  value: 'afternoon',
                },
              ]}
            />
            <ResourceFilterSelect
              paramKey="status"
              placeholder={t('statusPlaceholder')}
              options={[
                { label: t('status.configured'), value: 'configured' },
                { label: t('status.unconfigured'), value: 'unconfigured' },
              ]}
            />
            <ResourceFilterClear />
          </>
        }
      />
      <TimeConfigManager
        organizationId={id}
        academicYearId={academicYearId}
        academicYear={academicYear}
        configs={filteredConfigs}
        possibilities={filteredPossibilities}
        degrees={allDegrees}
        itineraries={allItineraries}
        canEdit={isAdminOrEditor}
        view={currentView}
        translations={translations}
      />
    </OrganizationSectionShell>
  );
}
