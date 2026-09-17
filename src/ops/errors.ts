export class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400
  ) {
    super(message);
  }
}

export function toHttp(error: unknown): { status: number; body: { error: string; code: string } } {
  if (error instanceof AppError) {
    return { status: error.status, body: { error: error.message, code: error.code } };
  }
  if (error instanceof Error) {
    return { status: 500, body: { error: "internal", code: "internal" } };
  }
  return { status: 500, body: { error: "internal", code: "internal" } };
}
