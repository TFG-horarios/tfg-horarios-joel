import { fetchAcademicYears } from '@/features/academic-year/queries';
import { fetchAllClassrooms } from '@/features/classroom/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchScheduleTimeConfigs } from '@/features/schedule-time-config/queries';
import { fetchAllSubjects } from '@/features/subject/queries';
import { fetchAllSubjectGroups } from '@/features/subject-group/queries';
import { fetchScheduleById, fetchScheduleSlots } from '../queries';
import { generateScheduleCsv } from '../utils';

export async function buildScheduleCsvExport(
  organizationId: string,
  scheduleId: string
): Promise<{ csv: string; filename: string } | null> {
  const schedule = await fetchScheduleById(organizationId, scheduleId);
  if (!schedule) {
    return null;
  }

  const [
    slots,
    classrooms,
    subjects,
    subjectGroups,
    degrees,
    academicYears,
    timeConfigs,
  ] = await Promise.all([
    fetchScheduleSlots(organizationId, scheduleId),
    fetchAllClassrooms(organizationId, schedule.academicYearId),
    fetchAllSubjects(organizationId, schedule.academicYearId),
    fetchAllSubjectGroups(organizationId, schedule.academicYearId),
    fetchAllDegrees(organizationId, schedule.academicYearId),
    fetchAcademicYears(organizationId),
    fetchScheduleTimeConfigs(organizationId, schedule.academicYearId).catch(
      () => []
    ),
  ]);

  if (!slots) {
    return null;
  }

  return generateScheduleCsv(
    schedule,
    slots,
    classrooms,
    subjects,
    subjectGroups,
    degrees,
    academicYears,
    schedule.timeConfigId
      ? (timeConfigs.find((config) => config.id === schedule.timeConfigId) ??
          null)
      : null
  );
}
