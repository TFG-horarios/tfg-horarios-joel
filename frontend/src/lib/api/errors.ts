export class ApiResponseError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiResponseError';
  }
}

export async function getApiErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  const isSafeErrorCode = (value: string) => /^ERR_[A-Z0-9_]+$/.test(value);

  try {
    const payload = (await response.json()) as unknown;
    if (payload && typeof payload === 'object') {
      const errorPayload = payload as Record<string, unknown>;
      if (
        typeof errorPayload.message === 'string' &&
        isSafeErrorCode(errorPayload.message)
      ) {
        return errorPayload.message;
      }
      if (
        typeof errorPayload.error === 'string' &&
        isSafeErrorCode(errorPayload.error)
      ) {
        return errorPayload.error;
      }
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
}

export async function createApiResponseError(
  response: Response,
  fallbackMessage: string
): Promise<ApiResponseError> {
  return new ApiResponseError(
    await getApiErrorMessage(response, fallbackMessage),
    response.status
  );
}

export function getActionErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  return error instanceof ApiResponseError ? error.message : fallbackMessage;
}
