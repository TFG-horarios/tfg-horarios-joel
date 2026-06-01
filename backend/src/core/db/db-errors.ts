export interface PostgresError extends Error {
  code: string;
  detail?: string;
  table?: string;
  constraint?: string;
}

export function isPostgresError(error: unknown): error is PostgresError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

export function getPostgresErrorCode(error: unknown): string | null {
  if (isPostgresError(error)) {
    return error.code;
  }
  if (typeof error === 'object' && error !== null && 'cause' in error) {
    return getPostgresErrorCode(error.cause);
  }
  return null;
}
