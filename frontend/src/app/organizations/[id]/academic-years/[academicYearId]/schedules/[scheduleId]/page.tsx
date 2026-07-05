import { notFound } from 'next/navigation';
import { fetchOrganizationById } from '@/features/organizations/queries';
import {
  fetchScheduleById,
  fetchScheduleSlots,
} from '@/features/schedule/queries';
import { fetchAcademicYears } from '@/features/academic-year/queries';
import { fetchAllClassrooms } from '@/features/classroom/queries';
import { fetchAllSubjects } from '@/features/subject/queries';
import { fetchAllSubjectGroups } from '@/features/subject-group/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchAllItineraries } from '@/features/itinerary/queries';
import { fetchScheduleTimeConfigs } from '@/features/schedule-time-config/queries';
import { SchedulePlanner } from '@/features/schedule/components/schedule-planner';
import { getSessionUser } from '@/features/auth/queries';
import { getOrganizationMemberRole } from '@/features/members/queries';

type SchedulePlannerPageProps = {
  params: Promise<{
    id: string;
    academicYearId: string;
    scheduleId: string;
  }>;
};

export default async function SchedulePlannerPage({
  params,
}: SchedulePlannerPageProps) {
  const { id, academicYearId, scheduleId } = await params;

  const [
    organization,
    schedule,
    slots,
    classrooms,
    subjects,
    subjectGroups,
    degrees,
    itineraries,
    academicYears,
    timeConfigs,
    user,
  ] = await Promise.all([
    fetchOrganizationById(id),
    fetchScheduleById(id, scheduleId),
    fetchScheduleSlots(id, scheduleId),
    fetchAllClassrooms(id, academicYearId),
    fetchAllSubjects(id, academicYearId),
    fetchAllSubjectGroups(id, academicYearId),
    fetchAllDegrees(id, academicYearId),
    fetchAllItineraries(id, academicYearId),
    fetchAcademicYears(id),
    fetchScheduleTimeConfigs(id, academicYearId).catch(() => []),
    getSessionUser(),
  ]);

  const memberRole = user ? await getOrganizationMemberRole(id) : null;
  const canUpdate = memberRole === 'admin' || memberRole === 'editor';

  if (!organization || !schedule) {
    notFound();
  }

  return (
    <div className="w-full">
      <SchedulePlanner
        organization={organization}
        schedule={schedule}
        initialSlots={slots}
        classrooms={classrooms}
        subjects={subjects}
        subjectGroups={subjectGroups}
        degrees={degrees}
        itineraries={itineraries}
        academicYear={
          academicYears.find((ay) => ay.id === schedule.academicYearId)!
        }
        timeConfig={
          schedule.timeConfigId
            ? (timeConfigs.find(
                (config) => config.id === schedule.timeConfigId
              ) ?? null)
            : null
        }
        canUpdate={canUpdate}
      />
    </div>
  );
}
