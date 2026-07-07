import { describe, expect, it } from 'vitest';
import {
  ApiResponseError,
  createApiResponseError,
  getActionErrorMessage,
  getApiErrorMessage,
} from './errors';

function jsonResponse(payload: unknown, status = 400) {
  return new Response(JSON.stringify(payload), { status });
}

describe('api errors', () => {
  it('reads safe backend error codes from message or error fields', async () => {
    await expect(
      getApiErrorMessage(jsonResponse({ message: 'ERR_NOT_FOUND' }), 'fallback')
    ).resolves.toBe('ERR_NOT_FOUND');

    await expect(
      getApiErrorMessage(jsonResponse({ error: 'ERR_FORBIDDEN' }), 'fallback')
    ).resolves.toBe('ERR_FORBIDDEN');
  });

  it('uses the fallback for unsafe payloads and invalid json bodies', async () => {
    await expect(
      getApiErrorMessage(jsonResponse({ message: 'Human message' }), 'fallback')
    ).resolves.toBe('fallback');

    const response = new Response('not-json', { status: 500 });
    await expect(getApiErrorMessage(response, 'fallback')).resolves.toBe(
      'fallback'
    );
  });

  it('creates typed ApiResponseError instances with response status', async () => {
    const error = await createApiResponseError(
      jsonResponse({ message: 'ERR_DUPLICATE' }, 409),
      'fallback'
    );

    expect(error).toBeInstanceOf(ApiResponseError);
    expect(error.message).toBe('ERR_DUPLICATE');
    expect(error.status).toBe(409);
  });

  it('maps action errors only when they come from the API layer', () => {
    expect(
      getActionErrorMessage(new ApiResponseError('ERR_AUTH', 401), 'fallback')
    ).toBe('ERR_AUTH');
    expect(getActionErrorMessage(new Error('boom'), 'fallback')).toBe(
      'fallback'
    );
  });
});
