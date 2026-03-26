export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "UPSTREAM_UNAVAILABLE"
  | "INTERNAL";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly expose: boolean;
  readonly details?: Record<string, unknown>;

  constructor(opts: {
    code: ErrorCode;
    status: number;
    message: string;
    expose?: boolean;
    details?: Record<string, unknown>;
    cause?: unknown;
  }) {
    super(opts.message);
    this.name = "AppError";
    this.code = opts.code;
    this.status = opts.status;
    this.expose = opts.expose ?? true;
    this.details = opts.details;
    if (opts.cause !== undefined) (this as unknown as { cause?: unknown }).cause = opts.cause;
  }
}

export function asAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) {
    return new AppError({
      code: "INTERNAL",
      status: 500,
      message: "Internal server error",
      expose: false,
      cause: err,
    });
  }
  return new AppError({
    code: "INTERNAL",
    status: 500,
    message: "Internal server error",
    expose: false,
    details: { thrown: err },
  });
}

