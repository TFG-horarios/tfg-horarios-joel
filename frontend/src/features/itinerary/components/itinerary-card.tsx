'use client';

import { memo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import type { DegreeDTO, ItineraryDTO } from '@tfg-horarios/shared';

export interface ItineraryCardProps {
  item: ItineraryDTO;
  degreeMap: Map<string, DegreeDTO>;
  translations: Record<string, string>;
}

export const ItineraryCard = memo(function ItineraryCard({
  item: itinerary,
  degreeMap,
  translations,
}: ItineraryCardProps) {
  const degree = degreeMap.get(itinerary.degreeId);
  return (
    <Card className={`h-full ${organizationHoverCardClassName}`}>
      <CardHeader className="space-y-2 p-5">
        <Badge
          variant="outline"
          className="w-fit font-mono uppercase tracking-[0.2em] border-purple-500/20 bg-purple-500/5 text-purple-500"
        >
          {itinerary.code}
        </Badge>
        <CardTitle className={`text-xl ${organizationHoverCardTitleClassName}`}>
          {itinerary.name}
        </CardTitle>
        <div className="pt-1 text-sm text-zinc-600 dark:text-zinc-400">
          <p className="font-medium text-black dark:text-white">
            {translations.degree}: {degree?.name ?? translations.unassigned}
          </p>
          <Badge
            variant="outline"
            className="mt-1 w-fit uppercase border-purple-500/20 bg-purple-500/5 text-purple-500"
          >
            {degree?.code
              ? `${translations.degreeCode}: ${degree.code}`
              : translations.noCode}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
});
