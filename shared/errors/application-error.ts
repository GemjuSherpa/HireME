/** Expected application failure that can be safely presented to an API consumer. */
export class ApplicationError extends Error {
  /**
   * @param message Safe, human-readable failure description.
   * @param status HTTP status used by delivery adapters.
   * @param field Optional form field associated with the failure.
   */
  constructor(
    message: string,
    public readonly status = 400,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}
