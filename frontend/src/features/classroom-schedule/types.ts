import type { Shift } from '@tfg-horarios/shared';

export interface ClassroomScheduleDTO {
  classroomId: string;
  academicYearId: string;
  shift: Shift;
  period: number;
}
