import type { IScheduleSlotRepository } from './schedule-slot.repository';
import type { IScheduleSlotDataProvider } from './providers/schedule-slot-data.provider';
import type { IScheduleSlotValidationProvider } from './providers/schedule-slot-validation.provider';

export interface ScheduleSlotTransactionDependencies {
  repository: IScheduleSlotRepository;
  dataProvider: IScheduleSlotDataProvider;
  validationProvider: IScheduleSlotValidationProvider;
}

export interface IScheduleSlotUnitOfWork {
  run<T>(
    work: (dependencies: ScheduleSlotTransactionDependencies) => Promise<T>
  ): Promise<T>;
}
