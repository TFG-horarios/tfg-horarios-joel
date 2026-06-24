import type { Shift } from '@tfg-horarios/shared';

export interface ISubjectProvider {
  getAvailableShifts(
    subjectId: string,
    organizationId: string
  ): Promise<Shift[] | null>;
}
