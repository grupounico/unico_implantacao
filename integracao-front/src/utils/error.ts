import axios from 'axios';

function readMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const data = value as Record<string, unknown>;

  return (
    readMessage(data.message) ??
    readMessage(data.error) ??
    (data.error && typeof data.error === 'object'
      ? JSON.stringify(data.error)
      : null)
  );
}

export function extractErrorMessage(
  error: unknown,
  fallback = 'Ocorreu um erro inesperado.',
) {
  if (axios.isAxiosError(error)) {
    return (
      readMessage(error.response?.data) ??
      readMessage(error.message) ??
      fallback
    );
  }

  if (error instanceof Error) {
    return readMessage(error.message) ?? fallback;
  }

  return fallback;
}
