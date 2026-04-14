export type ErrorCode = "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "UPSTREAM_UNAVAILABLE" | "INTERNAL";
export declare class AppError extends Error {
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
    });
}
export declare function asAppError(err: unknown): AppError;
