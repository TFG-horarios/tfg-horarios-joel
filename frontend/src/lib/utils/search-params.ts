export type SearchParamValue = string | string[] | undefined;

export function getSingleSearchParam(value: SearchParamValue) {
  return typeof value === 'string' ? value : undefined;
}

export function parsePositiveIntParam(
  value: SearchParamValue,
  fallback?: number
) {
  const rawValue = getSingleSearchParam(value);
  if (!rawValue) return fallback;

  const parsedValue = Number(rawValue);
  if (!Number.isInteger(parsedValue) || parsedValue < 1) return fallback;

  return parsedValue;
}

export function parseOptionalNumberParam(value: SearchParamValue) {
  const rawValue = getSingleSearchParam(value);
  if (!rawValue) return undefined;

  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}
