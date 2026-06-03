import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceGrid } from '@/components/shared/resource/resource-grid';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchSubjectGroups } from '@/features/subject-group/queries';
import { fetchSubjects } from '@/features/subject/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchAllItineraries } from '@/features/itinerary/queries';
import { SubjectGroupCard } from '@/features/subject-group/components/subject-group-card';
import { SubjectGroupActions } from '@/features/subject-group/components/subject-group-actions';
import { ResourceSearch } from '@/components/shared/resource/resource-search';
import { ResourceFilterSelect } from '@/components/shared/resource/resource-filter-select';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import type { SubjectGroupListQueryDTO } from '@tfg-horarios/shared';

type OrganizationSubjectGroupsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationSubjectGroupsPage({
  params,
  searchParams,
}: OrganizationSubjectGroupsPageProps) {
  const { id } = await params;
  const rawSearchParams = await searchParams;
  const query: SubjectGroupListQueryDTO = {
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
      (rawSearchParams.groupType === 'theory' ||
        rawSearchParams.groupType === 'problems' ||
        rawSearchParams.groupType === 'practices')
        ? rawSearchParams.groupType
        : undefined,
    degreeId:
      typeof rawSearchParams.degreeId === 'string'
        ? rawSearchParams.degreeId
        : undefined,
    itineraryId:
      typeof rawSearchParams.itineraryId === 'string'
        ? rawSearchParams.itineraryId
        : undefined,
  };

  const t = await getTranslations('Organizations.subjectGroups');
  const organization = await fetchOrganizationById(id);
  if (!organization) {
    notFound();
  }
  const [groups, subjects, degrees, itineraries] = await Promise.all([
    fetchSubjectGroups(id, query),
    fetchSubjects(id),
    fetchAllDegrees(id),
    fetchAllItineraries(id),
  ]);
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]));
  const degreeMap = new Map(degrees.map((degree) => [degree.id, degree]));
  const translations = {
    type: t('type'),
    'typeOptions.theory': t('typeOptions.theory'),
    'typeOptions.problems': t('typeOptions.problems'),
    'typeOptions.practices': t('typeOptions.practices'),
    shift: t('shift'),
    'shiftOptions.morning': t('shiftOptions.morning'),
    'shiftOptions.afternoon': t('shiftOptions.afternoon'),
    students: t('students'),
    hours: t('hours'),
    empty: t('empty'),
  };

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title', { organization: organization.name })}
      description={t('description')}
      count={groups.length}
      countLabel={t('countLabel')}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 w-full pb-4 border-b border-border/50">
        <ResourceToolbar
          search={<ResourceSearch placeholder={t('searchPlaceholder')} />}
          filters={
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <ResourceFilterSelect
                paramKey="subjectId"
                placeholder={t('subjectPlaceholder')}
                options={subjects.map((s) => ({ label: s.name, value: s.id }))}
              />
              <ResourceFilterSelect
                paramKey="groupType"
                placeholder={t('type')}
                options={[
                  { label: t('typeOptions.theory'), value: 'theory' },
                  { label: t('typeOptions.problems'), value: 'problems' },
                  { label: t('typeOptions.practices'), value: 'practices' },
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
              <ResourceFilterClear />
            </div>
          }
        />
        <SubjectGroupActions organizationId={id} subjects={subjects} />
      </div>
      <ResourceGrid
        items={groups}
        renderItem={(group) => {
          const subject = subjectMap.get(group.subjectId);
          const degree = subject ? degreeMap.get(subject.degreeId) : undefined;
          return (
            <SubjectGroupCard
              group={group}
              subject={subject}
              degree={degree}
              translations={translations}
            />
          );
        }}
        emptyState={<ResourceEmptyState message={t('empty')} />}
        keyExtractor={(group) => group.id}
      />
    </OrganizationSectionShell>
  );
}
