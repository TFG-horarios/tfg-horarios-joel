import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceGrid } from '@/components/shared/resource/resource-grid';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchSubjectGroups } from '@/features/subject-group/queries';
import { fetchSubjects } from '@/features/subject/queries';
import { fetchDegrees } from '@/features/degree/queries';
import { SubjectGroupCard } from '@/features/subject-group/components/subject-group-card';
import { SubjectGroupActions } from '@/features/subject-group/components/subject-group-actions';

type OrganizationSubjectGroupsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizationSubjectGroupsPage({
  params,
}: OrganizationSubjectGroupsPageProps) {
  const { id } = await params;
  const t = await getTranslations('Organizations.subjectGroups');
  const organization = await fetchOrganizationById(id);
  if (!organization) {
    notFound();
  }
  const [groups, subjects, degrees] = await Promise.all([
    fetchSubjectGroups(id),
    fetchSubjects(id),
    fetchDegrees(id),
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full pb-4 border-b border-border/50">
        <ResourceToolbar search={<div />} filters={undefined} />
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
