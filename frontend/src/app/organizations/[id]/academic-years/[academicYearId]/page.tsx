import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { fetchAcademicYears } from '@/features/academic-year/queries';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { getSessionUser } from '@/features/auth/queries';
import {
  getOrganizationMemberRole,
  fetchPaginatedMembers,
} from '@/features/members/queries';
import { fetchPaginatedSubjects } from '@/features/subject/queries';
import { fetchPaginatedClassrooms } from '@/features/classroom/queries';
import { fetchPaginatedDegrees } from '@/features/degree/queries';
import { fetchPaginatedItineraries } from '@/features/itinerary/queries';
import { fetchPaginatedSubjectGroups } from '@/features/subject-group/queries';
import { fetchPaginatedSchedules } from '@/features/schedule/queries';
import { fetchPaginatedActiveClassroomConfigurations } from '@/features/classroom-schedule/queries';
import { fetchPaginatedReservations } from '@/features/classroom-reservation/queries';

import { OrganizationSectionShell } from '@/features/organizations/components/organization-section-shell';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  CalendarRange,
  Activity,
  BookOpen,
  GraduationCap,
  Map,
  Users2,
  FileEdit,
  CheckCircle2,
  CalendarDays,
  ClockAlert,
  Users,
  Presentation,
  Hourglass,
  TimerReset,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AcademicYearPageProps = {
  params: Promise<{ id: string; academicYearId: string }>;
};

export default async function AcademicYearSummaryPage({
  params,
}: AcademicYearPageProps) {
  const { id, academicYearId } = await params;
  const tOrg = await getTranslations('Organizations.detail');
  const tForms = await getTranslations('Organizations.form.periodType.options');
  const tNav = await getTranslations('Organizations.navigation');
  const statusTranslations = await getTranslations('Common.status');

  const user = await getSessionUser();
  const role = user ? await getOrganizationMemberRole(id, user.id) : null;
  const isAdminOrEditor = role === 'admin' || role === 'editor';

  const [
    organization,
    academicYears,
    subjectsRes,
    classroomsRes,
    degreesRes,
    itinerariesRes,
    groupsRes,
    draftSchedulesRes,
    publishedSchedulesRes,
    classroomSchedulesRes,
    membersRes,
    pendingReservationsRes,
  ] = await Promise.all([
    fetchOrganizationById(id),
    fetchAcademicYears(id),
    fetchPaginatedSubjects(id, { limit: 1 }).catch(() => ({
      meta: { total: 0 },
    })),
    fetchPaginatedClassrooms(id, { limit: 1 }).catch(() => ({
      meta: { total: 0 },
    })),
    fetchPaginatedDegrees(id, { limit: 1 }).catch(() => ({
      meta: { total: 0 },
    })),
    fetchPaginatedItineraries(id, { limit: 1 }).catch(() => ({
      meta: { total: 0 },
    })),
    fetchPaginatedSubjectGroups(id, { limit: 1 }).catch(() => ({
      meta: { total: 0 },
    })),
    fetchPaginatedSchedules(id, {
      limit: 1,
      academicYearId,
      status: 'draft',
    }).catch(() => ({ meta: { total: 0 } })),
    fetchPaginatedSchedules(id, {
      limit: 1,
      academicYearId,
      status: 'published',
    }).catch(() => ({ meta: { total: 0 } })),
    fetchPaginatedActiveClassroomConfigurations(id, {
      limit: 1,
      academicYearId,
    }).catch(() => ({ meta: { total: 0 } })),
    isAdminOrEditor
      ? fetchPaginatedMembers(id, { limit: 1 }).catch(() => ({
          meta: { total: 0 },
        }))
      : Promise.resolve({ meta: { total: 0 } }),
    isAdminOrEditor
      ? fetchPaginatedReservations(id, { limit: 1, status: 'PENDING' }).catch(
          () => ({ meta: { total: 0 } })
        )
      : Promise.resolve({ meta: { total: 0 } }),
  ]);

  const academicYear = academicYears.find((ay) => ay.id === academicYearId);

  if (!organization || !academicYear) {
    notFound();
  }

  return (
    <OrganizationSectionShell
      label={tNav('summary')}
      title={academicYear.name}
      description={`Panel de control general y estado del curso ${academicYear.name}`}
      headerAction={
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wider shadow-sm',
              academicYear.isActive
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                : 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400'
            )}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              {academicYear.isActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  academicYear.isActive ? 'bg-emerald-500' : 'bg-slate-500'
                )}
              ></span>
            </span>
            {academicYear.isActive
              ? statusTranslations('active')
              : statusTranslations('inactive')}
          </div>
        </div>
      }
    >
      <div className="space-y-10">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <InteractiveCard className="h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">
                  Estado del Curso
                </h3>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Activity className="w-4 h-4" />
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center text-center gap-4">
                <div
                  className={cn(
                    'inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-base font-bold uppercase tracking-wider shadow-sm',
                    academicYear.isActive
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                      : 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400'
                  )}
                >
                  <span className="relative flex h-3 w-3 shrink-0">
                    {academicYear.isActive && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={cn(
                        'relative inline-flex rounded-full h-3 w-3',
                        academicYear.isActive
                          ? 'bg-emerald-500'
                          : 'bg-slate-500'
                      )}
                    ></span>
                  </span>
                  {academicYear.isActive
                    ? statusTranslations('active')
                    : statusTranslations('inactive')}
                </div>
                <p className="text-sm text-muted-foreground px-4">
                  {academicYear.isActive
                    ? 'El sistema está operando y generando horarios bajo esta configuración.'
                    : 'Este curso se encuentra actualmente inactivo.'}
                </p>
              </div>
            </div>
          </InteractiveCard>

          <InteractiveCard className="h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">
                  Calendario Lectivo
                </h3>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <CalendarRange className="w-4 h-4" />
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-violet-500/70" />
                    <span className="text-sm font-medium">Tipo de período</span>
                  </div>
                  <span className="font-semibold text-sm text-foreground capitalize">
                    {tForms(academicYear.periodType)}
                  </span>
                </div>

                {academicYear.period0Start && academicYear.period0End && (
                  <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarRange className="w-4 h-4 text-blue-500/70" />
                      <span className="text-sm font-medium">Período 1</span>
                    </div>
                    <span
                      className="font-semibold text-sm text-foreground"
                      suppressHydrationWarning
                    >
                      {format(
                        new Date(academicYear.period0Start),
                        'dd/MM/yyyy'
                      )}{' '}
                      <span className="text-muted-foreground font-normal mx-1">
                        -
                      </span>{' '}
                      {format(new Date(academicYear.period0End), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}

                {academicYear.period1Start && academicYear.period1End && (
                  <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarRange className="w-4 h-4 text-blue-500/70" />
                      <span className="text-sm font-medium">Período 2</span>
                    </div>
                    <span
                      className="font-semibold text-sm text-foreground"
                      suppressHydrationWarning
                    >
                      {format(
                        new Date(academicYear.period1Start),
                        'dd/MM/yyyy'
                      )}{' '}
                      <span className="text-muted-foreground font-normal mx-1">
                        -
                      </span>{' '}
                      {format(new Date(academicYear.period1End), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}

                {academicYear.period2Start && academicYear.period2End && (
                  <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarRange className="w-4 h-4 text-blue-500/70" />
                      <span className="text-sm font-medium">Período 3</span>
                    </div>
                    <span
                      className="font-semibold text-sm text-foreground"
                      suppressHydrationWarning
                    >
                      {format(
                        new Date(academicYear.period2Start),
                        'dd/MM/yyyy'
                      )}{' '}
                      <span className="text-muted-foreground font-normal mx-1">
                        -
                      </span>{' '}
                      {format(new Date(academicYear.period2End), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </InteractiveCard>

          <InteractiveCard className="h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">
                  Estructura Horaria
                </h3>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ClockAlert className="w-4 h-4 text-amber-500/70" />
                    <span className="text-sm font-medium">
                      Apertura del centro
                    </span>
                  </div>
                  <span className="font-semibold text-sm text-foreground">
                    {academicYear.centerOpeningTime}{' '}
                    <span className="text-muted-foreground font-normal mx-1">
                      -
                    </span>{' '}
                    {academicYear.centerClosingTime}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hourglass className="w-4 h-4 text-emerald-500/70" />
                    <span className="text-sm font-medium">
                      {tOrg('slotDuration')}
                    </span>
                  </div>
                  <span className="font-semibold text-sm text-foreground">
                    {academicYear.slotDurationMinutes} min
                  </span>
                </div>

                <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TimerReset className="w-4 h-4 text-violet-500/70" />
                    <span className="text-sm font-medium">
                      Duración del recreo
                    </span>
                  </div>
                  <span className="font-semibold text-sm text-foreground">
                    {academicYear.breakDurationMinutes} min
                  </span>
                </div>
              </div>
            </div>
          </InteractiveCard>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">
              Resumen del curso
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {isAdminOrEditor && (
              <InteractiveCard className="h-full">
                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      Miembros
                    </p>
                    <div className="p-2 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight">
                    {membersRes?.meta?.total || 0}
                  </h3>
                </div>
              </InteractiveCard>
            )}

            <InteractiveCard className="h-full">
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Grados
                  </p>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold tracking-tight">
                  {degreesRes?.meta?.total || 0}
                </h3>
              </div>
            </InteractiveCard>

            <InteractiveCard className="h-full">
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Itinerarios
                  </p>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Map className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold tracking-tight">
                  {itinerariesRes?.meta?.total || 0}
                </h3>
              </div>
            </InteractiveCard>

            <InteractiveCard className="h-full">
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Asignaturas
                  </p>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold tracking-tight">
                  {subjectsRes?.meta?.total || 0}
                </h3>
              </div>
            </InteractiveCard>

            <InteractiveCard className="h-full">
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Grupos
                  </p>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Users2 className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold tracking-tight">
                  {groupsRes?.meta?.total || 0}
                </h3>
              </div>
            </InteractiveCard>

            <InteractiveCard className="h-full">
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Aulas
                  </p>
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                    <Presentation className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold tracking-tight">
                  {classroomsRes?.meta?.total || 0}
                </h3>
              </div>
            </InteractiveCard>

            <InteractiveCard className="h-full">
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Horarios en Borrador
                  </p>
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <FileEdit className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold tracking-tight">
                  {draftSchedulesRes?.meta?.total || 0}
                </h3>
              </div>
            </InteractiveCard>

            <InteractiveCard className="h-full">
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Horarios Publicados
                  </p>
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold tracking-tight">
                  {publishedSchedulesRes?.meta?.total || 0}
                </h3>
              </div>
            </InteractiveCard>

            <InteractiveCard className="h-full">
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Horarios de Aula
                  </p>
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold tracking-tight">
                  {classroomSchedulesRes?.meta?.total || 0}
                </h3>
              </div>
            </InteractiveCard>

            {isAdminOrEditor && (
              <InteractiveCard className="h-full">
                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      Reservas Pendientes
                    </p>
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      <ClockAlert className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                    {pendingReservationsRes?.meta?.total || 0}
                  </h3>
                </div>
              </InteractiveCard>
            )}
          </div>
        </div>
      </div>
    </OrganizationSectionShell>
  );
}
