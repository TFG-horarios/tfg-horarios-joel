'use client';

import { memo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResourceRowActions } from '@/components/shared/resource/resource-row-actions';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ScheduleCardProps } from './schedule-card';

export const ScheduleRow = memo(function ScheduleRow({
  item: schedule,
  degreeMap,
  itineraryMap,
  organizationId,
  translations = {},
}: ScheduleCardProps) {
  const t = useTranslations('Organizations.schedules.card');
  const tStatus = useTranslations('Organizations.schedules');
  const degreeName = degreeMap.get(schedule.degreeId) || t('unknownDegree');
  const itineraryName = schedule.itineraryId
    ? itineraryMap.get(schedule.itineraryId) || t('unknownItinerary')
    : translations.globalItinerary || tStatus('itineraryOptions.common');

  const getStatusBadgeVariant = (status: 'draft' | 'published') => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
    }
  };

  const getStatusLabel = (status: 'draft' | 'published') => {
    return translations[status] || status;
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge
            variant={getStatusBadgeVariant(schedule.status)}
            className={`
              ${schedule.status === 'published' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}
              ${schedule.status === 'draft' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : ''}
            `}
          >
            {getStatusLabel(schedule.status)}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="font-medium">{degreeName}</TableCell>
      <TableCell>{itineraryName}</TableCell>
      <TableCell>{schedule.academicYear}</TableCell>
      <TableCell>{schedule.courseYear}</TableCell>
      <TableCell>{schedule.period}</TableCell>
      <TableCell className="capitalize">{schedule.shift || 'Global'}</TableCell>
      <ResourceRowActions
        onEdit={() => console.log('Edit', schedule.id)}
        onDelete={() => console.log('Delete', schedule.id)}
      >
        <Button asChild size="icon" variant="ghost">
          <Link
            href={`/organizations/${organizationId}/schedules/${schedule.id}`}
          >
            <Eye className="size-4 text-muted-foreground" />
          </Link>
        </Button>
      </ResourceRowActions>
    </TableRow>
  );
});
