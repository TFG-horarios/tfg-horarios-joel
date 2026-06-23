import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceLayout } from '@/components/shared/resource/resource-layout';
import { ResourceViewToggle } from '@/components/shared/resource/resource-view-toggle';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchPaginatedSubjects } from '@/features/subject/queries';
import { fetchAllItineraries } from '@/features/itinerary/queries';
import { fetchAcademicYears } from '@/features/academic-year/queries';
import { SubjectCard } from '@/features/subject/components/subject-card';
import { SubjectActions } from '@/features/subject/components/subject-actions';
import { ResourceSearch } from '@/components/shared/resource/resource-search';
import { ResourceFilterSelect } from '@/components/shared/resource/resource-filter-select';
import { ResourceFilterInput } from '@/components/shared/resource/resource-filter-input';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import { SubjectRow } from '@/features/subject/components/subject-row';
import { fetchPaginatedSubjectsAction } from '@/features/subject/actions';
import type { SubjectListQueryDTO } from '@tfg-horarios/shared';
import { getSessionUser } from '@/features/auth/queries';
import { getOrganizationMemberRole } from '@/features/members/queries';

type OrganizationSubjectsPageProps = {
  params: Promise<{ id: string; academicYearId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationSubjectsPage({
  params,
  searchParams,
}: OrganizationSubjectsPageProps) {
  const { id, academicYearId } = await params;
  const cookieStore = await cookies();
  const viewCookie = cookieStore.get('view-subjects')?.value;
  const limitCookie = cookieStore.get('table-limit')?.value;
  const defaultTableLimit = limitCookie ? parseInt(limitCookie, 10) : 8;
  const rawSearchParams = await searchParams;

  const currentView =
    rawSearchParams.view === 'table' || rawSearchParams.view === 'grid'
      ? rawSearchParams.view
      : viewCookie === 'table'
        ? 'table'
        : 'grid';

  const query: SubjectListQueryDTO & { view?: string } = {
    view: currentView,
    page: rawSearchParams.page ? Number(rawSearchParams.page) : 1,
    limit: rawSearchParams.limit
      ? Number(rawSearchParams.limit)
      : currentView === 'table'
        ? defaultTableLimit
        : 12,
    search:
      typeof rawSearchParams.q === 'string' ? rawSearchParams.q : undefined,
    code:
      typeof rawSearchParams.code === 'string'
        ? rawSearchParams.code
        : undefined,
    shift:
      typeof rawSearchParams.shift === 'string' &&
      (rawSearchParams.shift === 'morning' ||
        rawSearchParams.shift === 'afternoon')
        ? rawSearchParams.shift
        : undefined,
    period:
      typeof rawSearchParams.period === 'string'
        ? Number(rawSearchParams.period)
        : undefined,
    itineraryId:
      typeof rawSearchParams.itineraryId === 'string'
        ? rawSearchParams.itineraryId
        : undefined,
    degreeId:
      typeof rawSearchParams.degreeId === 'string'
        ? rawSearchParams.degreeId
        : undefined,
    courseYear:
      typeof rawSearchParams.courseYear === 'string'
        ? Number(rawSearchParams.courseYear)
        : undefined,
  };

  const t = await getTranslations('Organizations.subjects');
  const tSubjectGroups = await getTranslations('Organizations.subjectGroups');

  const [
    organization,
    { data: subjects, meta },
    degrees,
    itineraries,
    academicYears,
    user,
  ] = await Promise.all([
    fetchOrganizationById(id),
    fetchPaginatedSubjects(id, query),
    fetchAllDegrees(id),
    fetchAllItineraries(id),
    fetchAcademicYears(id),
    getSessionUser(),
  ]);

  const memberRole = user ? await getOrganizationMemberRole(id, user.id) : null;
  const isAdmin = memberRole === 'admin';
  const isEditor = memberRole === 'editor';
  const canCreate = isAdmin || isEditor;
  const canDeleteAll = isAdmin;
  const canImport = isAdmin || isEditor;
  const canReplaceAll = isAdmin;
  const canEdit = isAdmin || isEditor;
  const canDelete = isAdmin;

  if (!organization) {
    notFound();
  }
  const currentAcademicYear = academicYears.find(
    (ay) => ay.id === academicYearId
  );
  if (!currentAcademicYear) {
    notFound();
  }
  const degreeMap = new Map(degrees.map((degree) => [degree.id, degree]));
  const itineraryMap = new Map(
    itineraries.map((itinerary) => [itinerary.id, itinerary])
  );
  const translations = {
    degree: t('degree'),
    unknownDegree: t('unknownDegree'),
    course: t('course'),
    weeklyHours: t('weeklyHours'),
    common: t('common'),
    empty: t('empty'),
    period: t('form.period.label'),
    students: tSubjectGroups('students'),
    shifts: t('form.availableShifts.label'),
    itinerary: t('itineraryPlaceholder'),
    shiftMorning: t('shiftOptions.morning'),
    shiftAfternoon: t('shiftOptions.afternoon'),
    periodAnnual: t('periodOptions.annual'),
    period1: t('periodOptions.1'),
    period2: t('periodOptions.2'),
  };

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
            viewKey="view-subjects"
            defaultView={query.view as 'grid' | 'table'}
          />
        }
        search={<ResourceSearch placeholder={t('searchPlaceholder')} />}
        filters={
          <>
            <ResourceFilterInput
              paramKey="code"
              placeholder={t('codePlaceholder') || 'Código'}
            />
            <ResourceFilterSelect
              paramKey="degreeId"
              placeholder={t('degreePlaceholder')}
              options={degrees.map((d) => ({ label: d.name, value: d.id }))}
              searchable={true}
            />
            <ResourceFilterSelect
              paramKey="itineraryId"
              placeholder={t('itineraryPlaceholder')}
              options={[
                { label: t('itineraryOptions.common'), value: 'common' },
                ...itineraries.map((i) => ({ label: i.name, value: i.id })),
              ]}
              searchable={true}
            />
            <ResourceFilterSelect
              paramKey="courseYear"
              placeholder={t('coursePlaceholder')}
              options={[1, 2, 3, 4, 5, 6].map((c) => ({
                label: `${c}º`,
                value: c.toString(),
              }))}
            />
            <ResourceFilterSelect
              paramKey="period"
              placeholder={t('periodPlaceholder')}
              options={[0, 1, 2].map((p) => ({
                label:
                  p === 0 ? t('periodOptions.annual') : t(`periodOptions.${p}`),
                value: p.toString(),
              }))}
            />
            <ResourceFilterSelect
              paramKey="shift"
              placeholder={t('shiftPlaceholder')}
              options={[
                { label: t('shiftOptions.morning'), value: 'morning' },
                { label: t('shiftOptions.afternoon'), value: 'afternoon' },
              ]}
            />
            <ResourceFilterClear />
          </>
        }
        actions={
          <SubjectActions
            organization={organization}
            academicYear={currentAcademicYear}
            degrees={degrees}
            itineraries={itineraries}
            canCreate={canCreate}
            canDeleteAll={canDeleteAll}
            canImport={canImport}
            canReplaceAll={canReplaceAll}
          />
        }
      />
      <div>
        <ResourceLayout
          view={query.view as 'grid' | 'table'}
          items={subjects}
          meta={meta}
          query={query}
          loadMore={fetchPaginatedSubjectsAction.bind(null, id, query)}
          emptyState={<ResourceEmptyState message={t('empty')} />}
          GridItemComponent={SubjectCard}
          gridItemProps={{
            organization,
            academicYear: currentAcademicYear,
            degreeMap,
            itineraryMap,
            translations,
            canEdit,
            canDelete,
          }}
          tableHeaders={[
            'Código',
            'Nombre',
            'Itinerario',
            translations.degree,
            'Curso',
            'Periodo',
            'Horas',
            'Turnos',
            'Estudiantes',
            ...(canEdit || canDelete ? ['Acciones'] : []),
          ]}
          TableRowComponent={SubjectRow}
          tableRowProps={{
            organization,
            academicYear: currentAcademicYear,
            degreeMap,
            itineraryMap,
            translations,
            canEdit,
            canDelete,
          }}
        />
      </div>
    </OrganizationSectionShell>
  );
}
