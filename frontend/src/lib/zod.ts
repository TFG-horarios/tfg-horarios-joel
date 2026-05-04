export function getFieldErrors(error: any) {
  const formatted = error.format();
  const fieldErrors: Record<string, string[]> = {};

  for (const key in formatted) {
    if (key !== '_errors') {
      fieldErrors[key] = formatted[key]?._errors || [];
    }
  }

  return fieldErrors;
}
