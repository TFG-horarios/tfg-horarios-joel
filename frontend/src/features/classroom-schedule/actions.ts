'use server';

import { fetchActiveClassroomConfigurations } from './queries';
import type { ClassroomConfigurationListQueryDTO } from '@tfg-horarios/shared';

export async function fetchActiveClassroomConfigurationsAction(
  organizationId: string,
  query?: ClassroomConfigurationListQueryDTO
) {
  try {
    const data = await fetchActiveClassroomConfigurations(
      organizationId,
      query
    );
    return { success: true, ...data };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      data: [] as {
        classroomId: string;
        academicYearId: string;
        shift: 'morning' | 'afternoon';
        period: number;
      }[],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
