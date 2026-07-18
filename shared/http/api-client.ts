/** Error returned by an internal HireME JSON API. */
export class ApiClientError extends Error {
  /**
   * @param message Human-readable error suitable for the current UI.
   * @param status HTTP response status.
   * @param field Optional form field associated with the error.
   */
  constructor(
    message: string,
    public readonly status: number,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type ErrorPayload = { error?: string; field?: string };

/**
 * Sends a request to an internal JSON endpoint and normalises unsuccessful responses.
 *
 * @param input Relative or absolute request URL.
 * @param init Standard Fetch API options.
 * @returns The parsed JSON response body.
 * @throws ApiClientError when the response is not successful or cannot be parsed.
 */
export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = await readJson<T | ErrorPayload>(response);
  if (!response.ok) {
    const error = payload as ErrorPayload;
    throw new ApiClientError(
      error.error ?? "The request could not be completed.",
      response.status,
      error.field,
    );
  }
  return payload as T;
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiClientError("The server returned an invalid response.", response.status);
  }
}
