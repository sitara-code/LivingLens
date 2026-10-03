export interface MlPredictionResponse {
  success: boolean;
  prediction?: unknown;
  error?: string;
}

export class MlServiceError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = 'MlServiceError';
    this.status = status;
  }
}

export async function requestMlPrediction(
  payload: Record<string, unknown>,
  signal?: AbortSignal
): Promise<MlPredictionResponse> {
  const serviceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';
  let response: Response;

  try {
    response = await fetch(`${serviceUrl.replace(/\/$/, '')}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
  } catch {
    throw new MlServiceError('ML service unavailable', 503);
  }

  let result: MlPredictionResponse | null = null;
  try {
    result = (await response.json()) as MlPredictionResponse;
  } catch {
    throw new MlServiceError('ML service returned an invalid response', 502);
  }

  if (!response.ok || result.success === false) {
    throw new MlServiceError(result.error || `ML service request failed (${response.status})`, response.status);
  }

  return result;
}
