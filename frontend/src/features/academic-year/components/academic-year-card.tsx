import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AcademicYearDTO } from '@tfg-horarios/shared';
import { useTranslations } from 'next-intl';
import { Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export function AcademicYearCard({
  organizationId,
  academicYear,
}: {
  organizationId: string;
  academicYear: AcademicYearDTO;
}) {
  const t = useTranslations('Common.status');

  return (
    <Link
      href={`/organizations/${organizationId}/academic-years/${academicYear.id}`}
    >
      <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:border-black/30 dark:hover:border-white/30 cursor-pointer h-full">
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/5 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
        <CardHeader className="p-5">
          <div className="flex items-center justify-between mb-2">
            <Badge variant={academicYear.isActive ? 'default' : 'secondary'}>
              {academicYear.isActive ? t('active') : t('inactive')}
            </Badge>
          </div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            {academicYear.name}
          </CardTitle>
          <CardDescription className="pt-2 flex flex-col gap-1">
            {academicYear.period0Start && academicYear.period0End && (
              <span className="text-sm">
                Período 1:{' '}
                {format(new Date(academicYear.period0Start), 'dd/MM/yyyy')} -{' '}
                {format(new Date(academicYear.period0End), 'dd/MM/yyyy')}
              </span>
            )}
            {academicYear.period1Start && academicYear.period1End && (
              <span className="text-sm">
                Período 2:{' '}
                {format(new Date(academicYear.period1Start), 'dd/MM/yyyy')} -{' '}
                {format(new Date(academicYear.period1End), 'dd/MM/yyyy')}
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
