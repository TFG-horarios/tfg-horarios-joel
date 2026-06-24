'use server';

import { fetchPaginatedActiveClassroomConfigurations } from './queries';
import type { ClassroomConfigurationListQueryDTO } from '@tfg-horarios/shared';

export async function fetchPaginatedActiveClassroomConfigurationsAction(
  organizationId: string,
  query: ClassroomConfigurationListQueryDTO,
  page: number
) {
  return fetchPaginatedActiveClassroomConfigurations(organizationId, {
    ...query,
    page,
  });
}
