import type { Shift } from './subject-group.entity';

export interface ISubjectProvider {
  getAvailableShifts(
    subjectId: string,
    organizationId: string
  ): Promise<Shift[] | null>;
}
