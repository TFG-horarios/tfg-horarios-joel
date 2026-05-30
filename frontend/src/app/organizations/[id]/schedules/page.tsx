import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchDegrees } from '@/features/degree/queries';
import { fetchItineraries } from '@/features/itinerary/queries';
import { fetchSchedules } from '@/features/schedule/queries';
import { ScheduleGenerator } from '@/features/schedule/components/schedule-generator';
import { ResourceToolbar } from '@/components/shared/resource/resource-toolbar';
import { ResourceActions } from '@/components/shared/resource/resource-actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, Eye, FileSpreadsheet, Layers } from 'lucide-react';

type OrganizationSchedulesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizationSchedulesPage({
  params,
}: OrganizationSchedulesPageProps) {
  const { id } = await params;
  const t = await getTranslations('Organizations.schedules');
  const organization = await fetchOrganizationById(id);

  if (!organization) {
    notFound();
  }

  const [degrees, itineraries, schedules] = await Promise.all([
    fetchDegrees(id),
    fetchItineraries(id),
    fetchSchedules(id),
  ]);

  const getDegreeName = (degreeId: string | null) => {
    const d = degrees.find((deg) => deg.id === degreeId);
    return d?.name || 'Degree';
  };

  const getItineraryName = (itineraryId: string | null) => {
    if (!itineraryId) return 'None';
    const i = itineraries.find((it) => it.id === itineraryId);
    return i ? i.code : 'Itinerary';
  };

  const getStatusBadgeVariant = (
    status: 'draft' | 'published' | 'archived'
  ) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
    }
  };

  const getStatusLabel = (status: 'draft' | 'published' | 'archived') => {
    switch (status) {
      case 'published':
        return t('published');
      case 'draft':
        return t('draft');
      case 'archived':
        return t('archived');
    }
  };

  return (
    <OrganizationSectionShell
      label={t('label')}
      title={t('title', { organization: organization.name })}
      description={t('description')}
      count={schedules.length}
      countLabel={t('countLabel')}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full pb-4 border-b border-border/50">
        <ResourceToolbar search={<div />} filters={undefined} />
        <ResourceActions>
          <ScheduleGenerator
            organizationId={id}
            degrees={degrees}
            itineraries={itineraries}
          />
        </ResourceActions>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
        <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Calendar className="size-5 text-muted-foreground" />
            Generated Schedules
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            Total versions: {schedules.length}
          </span>
        </div>

        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="rounded-full bg-muted/80 p-3 mb-4">
              <FileSpreadsheet className="size-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">{t('empty')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure your organization's degrees, subjects, and groups first,
              then click generate.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Degree</TableHead>
                <TableHead>Itinerary</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>{t('version')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow
                  key={schedule.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Layers className="size-4 text-indigo-500/80" />
                      <span>{getDegreeName(schedule.degreeId)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getItineraryName(schedule.itineraryId ?? null)}
                  </TableCell>
                  <TableCell>Year {schedule.courseYear}</TableCell>
                  <TableCell>{schedule.academicYear}</TableCell>
                  <TableCell>Semester {schedule.period}</TableCell>
                  <TableCell className="capitalize">
                    {schedule.shift || 'Global'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {schedule.version}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(schedule.status)}
                      className={`
                        ${schedule.status === 'published' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20' : ''}
                        ${schedule.status === 'draft' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20' : ''}
                        ${schedule.status === 'archived' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20' : ''}
                      `}
                    >
                      {getStatusLabel(schedule.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="hover:bg-indigo-500/10 hover:text-indigo-500"
                    >
                      <Link
                        href={`/organizations/${id}/schedules/${schedule.id}`}
                      >
                        <Eye className="size-4 mr-2" />
                        View Planner
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </OrganizationSectionShell>
  );
}
