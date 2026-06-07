import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAcademicYearOptions(pastYears = 1, futureYears = 5) {
  const currentYear = new Date().getFullYear();
  const options = [];

  for (let i = currentYear - pastYears; i <= currentYear + futureYears; i++) {
    const startYear = i;
    const endYear = startYear + 1;
    const value = `${startYear}-${endYear}`;
    options.push({ label: value, value });
  }

  return options;
}
