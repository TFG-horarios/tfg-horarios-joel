import type { ZodError } from 'zod';

export function zodErrorToActionErrors(
  error: ZodError
): Record<string, string[]> {
  const { fieldErrors, formErrors } = error.flatten();

  if (formErrors.length === 0) {
    return fieldErrors;
  }

  return {
    ...fieldErrors,
    root: formErrors,
  };
}
