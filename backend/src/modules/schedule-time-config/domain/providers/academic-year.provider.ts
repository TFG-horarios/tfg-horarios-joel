export interface AcademicYearTiming {
  organizationId: string;
  centerOpeningTime: string;
  centerClosingTime: string;
  slotDurationMinutes: number;
  breakDurationMinutes: number;
}

export interface IAcademicYearProvider {
  getTiming(academicYearId: string): Promise<AcademicYearTiming | null>;
}
