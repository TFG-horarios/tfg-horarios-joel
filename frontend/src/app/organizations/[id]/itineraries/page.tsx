import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ResourceGrid } from '@/components/shared/resource/resource-grid';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchDegrees } from '@/features/degree/queries';
import { fetchItineraries } from '@/features/itinerary/queries';
import { ItineraryCard } from '@/features/itinerary/components/itinerary-card';
import { ItineraryActions } from '@/features/itinerary/components/itinerary-actions';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';

type OrganizationItinerariesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizationItinerariesPage({
  params,
}: OrganizationItinerariesPageProps) {
  const { id } = await params;
  const t = await getTranslations('Organizations.itineraries');
  const organization = await fetchOrganizationById(id);
  if (!organization) {
    notFound();
  }
  const [itineraries, degrees] = await Promise.all([
    fetchItineraries(id),
    fetchDegrees(id),
  ]);
  const degreeMap = new Map(degrees.map((d) => [d.id, d]));
  const translations = {
    degree: t('degree'),
    unassigned: t('unassigned'),
    degreeCode: t('degreeCode'),
    noCode: t('noCode'),
  };

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title', { organization: organization.name })}
      description={t('description')}
      count={itineraries.length}
      countLabel={t('countLabel')}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full pb-4 border-b border-border/50">
        <ResourceToolbar search={<div />} filters={undefined} />
        <ItineraryActions
          organizationId={id}
          existingItineraries={itineraries}
          degrees={degrees}
        />
      </div>
      <ResourceGrid
        items={itineraries}
        renderItem={(itinerary) => (
          <ItineraryCard
            itinerary={itinerary}
            degree={degreeMap.get(itinerary.degreeId)}
            translations={translations}
          />
        )}
        emptyState={<ResourceEmptyState message={t('empty')} />}
        keyExtractor={(itinerary) => itinerary.id}
      />
    </OrganizationSectionShell>
  );
}
