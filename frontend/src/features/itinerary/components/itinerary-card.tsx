'use client';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import type { DegreeDTO, ItineraryDTO } from '@tfg-horarios/shared';

export interface ItineraryCardProps {
  itinerary: ItineraryDTO;
  degree: DegreeDTO | undefined;
  translations: Record<string, string>;
}

export function ItineraryCard({
  itinerary,
  degree,
  translations,
}: ItineraryCardProps) {
  return (
    <Card className={`h-full ${organizationHoverCardClassName}`}>
      <CardHeader className="space-y-2 p-5">
        <CardTitle className={`text-xl ${organizationHoverCardTitleClassName}`}>
          {itinerary.name}
        </CardTitle>
        <div className="pt-1 text-sm text-zinc-600 dark:text-zinc-400">
          <p className="font-medium text-black dark:text-white">
            {translations.degree}: {degree?.name ?? translations.unassigned}
          </p>
          <CardDescription className="mt-1">
            {degree?.code
              ? `${translations.degreeCode}: ${degree.code}`
              : translations.noCode}
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
