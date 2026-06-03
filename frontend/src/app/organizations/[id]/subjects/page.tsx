import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceGrid } from '@/components/shared/resource/resource-grid';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchSubjects } from '@/features/subject/queries';
import { fetchItineraries } from '@/features/itinerary/queries';
import { SubjectCard } from '@/features/subject/components/subject-card';
import { SubjectActions } from '@/features/subject/components/subject-actions';
import { ResourceSearch } from '@/components/shared/resource/resource-search';
import { ResourceFilterSelect } from '@/components/shared/resource/resource-filter-select';
import { ResourceFilterInput } from '@/components/shared/resource/resource-filter-input';
import { ResourceFilterClear } from '@/components/shared/resource/resource-filter-clear';
import type { SubjectListQueryDTO } from '@tfg-horarios/shared';

type OrganizationSubjectsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationSubjectsPage({
  params,
  searchParams,
}: OrganizationSubjectsPageProps) {
  const { id } = await params;
  const rawSearchParams = await searchParams;
  const query: SubjectListQueryDTO = {
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
  const organization = await fetchOrganizationById(id);
  if (!organization) {
    notFound();
  }
  const [subjects, degrees, itineraries] = await Promise.all([
    fetchSubjects(id, query),
    fetchAllDegrees(id),
    fetchItineraries(id),
  ]);
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
  };

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title', { organization: organization.name })}
      description={t('description')}
      count={subjects.length}
      countLabel={t('countLabel')}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 w-full pb-4 border-b border-border/50">
        <ResourceToolbar
          search={<ResourceSearch placeholder={t('searchPlaceholder')} />}
          filters={
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <ResourceFilterInput
                paramKey="code"
                placeholder={t('codePlaceholder') || 'Código'}
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
                options={[0, 1, 2, 3].map((p) => ({
                  label:
                    p === 0
                      ? t('periodOptions.annual')
                      : t(`periodOptions.${p}`),
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
            </div>
          }
        />
        <SubjectActions
          organizationId={id}
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
            itineraryName={
              subject.itineraryId
                ? itineraryMap.get(subject.itineraryId)?.name
                : undefined
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
