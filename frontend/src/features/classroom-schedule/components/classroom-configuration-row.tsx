'use client';

import { memo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResourceRowActions } from '@/components/shared/resource/resource-row-actions';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ClassroomConfigurationCardProps } from './classroom-configuration-card';

export const ClassroomConfigurationRow = memo(
  function ClassroomConfigurationRow({
    item: config,
    classroomMap,
    organizationId,
    translations = {},
  }: ClassroomConfigurationCardProps) {
    const t = useTranslations('Organizations.classroomSchedules.card');
    const classroomName =
      classroomMap.get(config.classroomId) || t('unknownClassroom');
    const shiftLabel = translations[`shift_${config.shift}`] || config.shift;

    const scheduleUrl = `/organizations/${organizationId}/classroom-schedules/${config.classroomId}?academicYear=${encodeURIComponent(config.academicYear)}&shift=${config.shift}&period=${config.period}`;

    return (
      <TableRow>
        <TableCell className="font-medium">{classroomName}</TableCell>
        <TableCell>{config.academicYear}</TableCell>
        <TableCell>{config.period}</TableCell>
        <TableCell className="capitalize">{shiftLabel}</TableCell>
        <ResourceRowActions>
          <Button asChild size="icon" variant="ghost">
            <Link href={scheduleUrl}>
              <Eye className="size-4 text-muted-foreground" />
            </Link>
          </Button>
        </ResourceRowActions>
      </TableRow>
    );
  }
);
