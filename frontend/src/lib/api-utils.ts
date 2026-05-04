export async function parseJsonResponse(
  response: Response,
  fallbackMessage: string
) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message?: unknown }).message ?? fallbackMessage)
        : fallbackMessage;
    throw new Error(message);
  }

  return payload;
}
