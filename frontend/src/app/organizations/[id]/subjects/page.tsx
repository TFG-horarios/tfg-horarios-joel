import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceGrid } from '@/components/shared/resource/resource-grid';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchDegrees } from '@/features/degree/queries';
import { fetchSubjects } from '@/features/subject/queries';
import { fetchItineraries } from '@/features/itinerary/queries';
import { SubjectCard } from '@/features/subject/components/subject-card';
import { SubjectActions } from '@/features/subject/components/subject-actions';

type OrganizationSubjectsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizationSubjectsPage({
  params,
}: OrganizationSubjectsPageProps) {
  const { id } = await params;
  const t = await getTranslations('Organizations.subjects');
  const organization = await fetchOrganizationById(id);
  if (!organization) {
    notFound();
  }
  const [subjects, degrees, itineraries] = await Promise.all([
    fetchSubjects(id),
    fetchDegrees(id),
    fetchItineraries(id),
  ]);
  const degreeMap = new Map(degrees.map((degree) => [degree.id, degree]));
  const translations = {
    degree: t('degree'),
    unknownDegree: t('unknownDegree'),
    course: t('course'),
    weeklyHours: t('weeklyHours'),
    common: t('common'),
    empty: t('empty'),
  };

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title', { organization: organization.name })}
      description={t('description')}
      count={subjects.length}
      countLabel={t('countLabel')}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full pb-4 border-b border-border/50">
        <ResourceToolbar search={<div />} filters={undefined} />
        <SubjectActions
          organizationId={id}
          existingSubjects={subjects}
          degrees={degrees}
          itineraries={itineraries}
        />
      </div>
      <ResourceGrid
        items={subjects}
        renderItem={(subject) => (
          <SubjectCard
            subject={subject}
            degreeName={
              degreeMap.get(subject.degreeId)?.name ?? t('unknownDegree')
            }
            translations={translations}
          />
        )}
        emptyState={<ResourceEmptyState message={t('empty')} />}
        keyExtractor={(subject) => subject.id}
      />
    </OrganizationSectionShell>
  );
}
