import type {
  ImportSchedulesBodyDTO,
  ImportSchedulesOverwriteDTO,
  ImportSchedulesResultDTO,
} from '@tfg-horarios/shared';

export interface IScheduleImportProvider {
  checkOverwrite(
    organizationId: string,
    input: ImportSchedulesBodyDTO
  ): Promise<ImportSchedulesOverwriteDTO>;
  importSchedules(
    organizationId: string,
    input: ImportSchedulesBodyDTO
  ): Promise<ImportSchedulesResultDTO>;
}
