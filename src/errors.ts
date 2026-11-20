export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const notFound = (what: string) => new HttpError(404, `${what} not found`);
export const conflict = (message: string) => new HttpError(409, message);

/** Parses a positive integer route param or throws 400. */
export function idParam(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "Invalid id");
  return id;
}
