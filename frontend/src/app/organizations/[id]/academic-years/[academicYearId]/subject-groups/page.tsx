import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceLayout } from '@/components/shared/resource/resource-layout';
import { ResourceViewToggle } from '@/components/shared/resource/resource-view-toggle';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchPaginatedSubjectGroups } from '@/features/subject-group/queries';
import { fetchAllSubjects } from '@/features/subject/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchAllItineraries } from '@/features/itinerary/queries';
import { SubjectGroupCard } from '@/features/subject-group/components/subject-group-card';
import { SubjectGroupActions } from '@/features/subject-group/components/subject-group-actions';
import { ResourceSearch } from '@/components/shared/resource/resource-search';
import { ResourceFilterSelect } from '@/components/shared/resource/resource-filter-select';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import { SubjectGroupRow } from '@/features/subject-group/components/subject-group-row';
import { fetchPaginatedSubjectGroupsAction } from '@/features/subject-group/actions';
import {
  type SubjectGroupListQueryDTO,
  type GroupType,
  GROUP_TYPES,
} from '@tfg-horarios/shared';
import { getSessionUser } from '@/features/auth/queries';
import { getOrganizationMemberRole } from '@/features/members/queries';

type OrganizationSubjectGroupsPageProps = {
  params: Promise<{ id: string; academicYearId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationSubjectGroupsPage({
  params,
  searchParams,
}: OrganizationSubjectGroupsPageProps) {
  const { id, academicYearId } = await params;
  const cookieStore = await cookies();
  const viewCookie = cookieStore.get('view-subject-groups')?.value;
  const limitCookie = cookieStore.get('table-limit')?.value;
  const defaultTableLimit = limitCookie ? parseInt(limitCookie, 10) : 8;
  const rawSearchParams = await searchParams;

  const currentView =
    rawSearchParams.view === 'table' || rawSearchParams.view === 'grid'
      ? rawSearchParams.view
      : viewCookie === 'table'
        ? 'table'
        : 'grid';

  const query: SubjectGroupListQueryDTO & { view?: string } = {
    view: currentView,
    page: rawSearchParams.page ? Number(rawSearchParams.page) : 1,
    limit: rawSearchParams.limit
      ? Number(rawSearchParams.limit)
      : currentView === 'table'
        ? defaultTableLimit
        : 12,
    search:
      typeof rawSearchParams.q === 'string' ? rawSearchParams.q : undefined,
    subjectId:
      typeof rawSearchParams.subjectId === 'string'
        ? rawSearchParams.subjectId
        : undefined,
    shift:
      typeof rawSearchParams.shift === 'string' &&
      (rawSearchParams.shift === 'morning' ||
        rawSearchParams.shift === 'afternoon')
        ? rawSearchParams.shift
        : undefined,
    groupType:
      typeof rawSearchParams.groupType === 'string' &&
      GROUP_TYPES.includes(rawSearchParams.groupType as GroupType)
        ? (rawSearchParams.groupType as GroupType)
        : undefined,
    degreeId:
      typeof rawSearchParams.degreeId === 'string'
        ? rawSearchParams.degreeId
        : undefined,
    itineraryId:
      typeof rawSearchParams.itineraryId === 'string'
        ? rawSearchParams.itineraryId
        : undefined,
    year:
      typeof rawSearchParams.year === 'string'
        ? Number(rawSearchParams.year)
        : undefined,
    needsComputerLab:
      typeof rawSearchParams.needsComputerLab === 'string' &&
      (rawSearchParams.needsComputerLab === 'true' ||
        rawSearchParams.needsComputerLab === 'false')
        ? (rawSearchParams.needsComputerLab as 'true' | 'false')
        : undefined,
  };

  const t = await getTranslations('Organizations.subjectGroups');
  const tSubjects = await getTranslations('Organizations.subjects');

  const [
    organization,
    { data: groups, meta },
    historicalSubjects,
    historicalDegrees,
    historicalItineraries,
    user,
  ] = await Promise.all([
    fetchOrganizationById(id),
    fetchPaginatedSubjectGroups(id, query),
    fetchAllSubjects(id, academicYearId),
    fetchAllDegrees(id, academicYearId),
    fetchAllItineraries(id, academicYearId),
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
  const activeSubjects = historicalSubjects.filter(
    (subject) => !subject.deletedAt
  );
  const activeDegrees = historicalDegrees.filter((degree) => !degree.deletedAt);
  const activeItineraries = historicalItineraries.filter(
    (itinerary) => !itinerary.deletedAt
  );
  const subjectMap = new Map(
    historicalSubjects.map((subject) => [subject.id, subject])
  );
  const degreeMap = new Map(
    historicalDegrees.map((degree) => [degree.id, degree])
  );
  const itineraryMap = new Map(
    historicalItineraries.map((itinerary) => [itinerary.id, itinerary])
  );
  const translations = {
    type: t('type'),
    'typeOptions.theory': t('typeOptions.theory'),
    'typeOptions.problems': t('typeOptions.problems'),
    'typeOptions.practices': t('typeOptions.practices'),
    'typeOptions.reduced_practices': t('typeOptions.reduced_practices'),
    'typeOptions.tutoring': t('typeOptions.tutoring'),
    shift: t('shift'),
    'shiftOptions.morning': t('shiftOptions.morning'),
    'shiftOptions.afternoon': t('shiftOptions.afternoon'),
    students: t('students'),
    hours: t('hours'),
    empty: t('empty'),
    number: t('form.groupNumber.label'),
    degree: tSubjects('degree'),
    itinerary: tSubjects('itineraryPlaceholder'),
    subject: tSubjects('label'),
    common: tSubjects('common'),
    course: tSubjects('course'),
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
            viewKey="view-subject-groups"
            defaultView={query.view as 'grid' | 'table'}
          />
        }
        search={<ResourceSearch placeholder={t('searchPlaceholder')} />}
        filters={
          <>
            <ResourceFilterSelect
              paramKey="subjectId"
              placeholder={t('subjectPlaceholder')}
              options={activeSubjects.map((s) => ({
                label: s.name,
                value: s.id,
              }))}
              searchable={true}
            />
            <ResourceFilterSelect
              paramKey="groupType"
              placeholder={t('type')}
              options={[
                { label: t('typeOptions.theory'), value: 'theory' },
                { label: t('typeOptions.problems'), value: 'problems' },
                { label: t('typeOptions.practices'), value: 'practices' },
                {
                  label: t('typeOptions.reduced_practices'),
                  value: 'reduced_practices',
                },
                { label: t('typeOptions.tutoring'), value: 'tutoring' },
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
              paramKey="degreeId"
              placeholder={t('degreePlaceholder')}
              options={activeDegrees.map((d) => ({
                label: d.name,
                value: d.id,
              }))}
              searchable={true}
            />
            <ResourceFilterSelect
              paramKey="year"
              placeholder={tSubjects('coursePlaceholder')}
              options={[1, 2, 3, 4, 5, 6].map((c) => ({
                label: `${c}º`,
                value: c.toString(),
              }))}
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
              paramKey="needsComputerLab"
              placeholder="Aula PC"
              options={[
                { label: 'Sí', value: 'true' },
                { label: 'No', value: 'false' },
              ]}
            />
            <ResourceFilterClear />
          </>
        }
        actions={
          <SubjectGroupActions
            organizationId={id}
            subjects={activeSubjects}
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
          items={groups}
          meta={meta}
          query={query}
          loadMore={fetchPaginatedSubjectGroupsAction.bind(null, id, query)}
          emptyState={<ResourceEmptyState message={t('empty')} />}
          GridItemComponent={SubjectGroupCard}
          gridItemProps={{
            subjectMap,
            degreeMap,
            itineraryMap,
            translations,
            canEdit,
            canDelete,
          }}
          tableHeaders={[
            'Cód. Asig.',
            translations.subject,
            translations.type,
            'Aula PC',
            translations.number,
            'Nombre',
            'Horas',
            translations.students,
            translations.shift,
            translations.course,
            translations.degree,
            translations.itinerary,
            ...(canEdit || canDelete ? ['Acciones'] : []),
          ]}
          TableRowComponent={SubjectGroupRow}
          tableRowProps={{
            subjectMap,
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
