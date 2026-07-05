'use client';

import { memo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResourceRowActions } from '@/components/shared/resource/resource-row-actions';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ClassroomScheduleDTO } from '../types';

export interface ClassroomScheduleRowProps {
  item: ClassroomScheduleDTO;
  classroomMap: Record<string, string>;
  organizationId: string;
  academicYearId: string;
  translations?: Record<string, string>;
}

export const ClassroomScheduleRow = memo(function ClassroomScheduleRow({
  item: config,
  classroomMap,
  organizationId,
  academicYearId,
  translations = {},
}: ClassroomScheduleRowProps) {
  const t = useTranslations('Organizations.classroomSchedules.card');
  const classroomName =
    classroomMap[config.classroomId] || t('unknownClassroom');
  const shiftLabel = translations[`shift_${config.shift}`] || config.shift;

  const scheduleUrl = `/organizations/${organizationId}/academic-years/${academicYearId}/classroom-schedules/${config.classroomId}?shift=${config.shift}&period=${config.period}`;

  return (
    <TableRow>
      <TableCell className="font-medium">{classroomName}</TableCell>
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
});
