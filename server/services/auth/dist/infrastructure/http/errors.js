export class AppError extends Error {
    code;
    status;
    expose;
    details;
    constructor(opts) {
        super(opts.message);
        this.name = "AppError";
        this.code = opts.code;
        this.status = opts.status;
        this.expose = opts.expose ?? true;
        this.details = opts.details;
        if (opts.cause !== undefined)
            this.cause = opts.cause;
    }
}
export function asAppError(err) {
    if (err instanceof AppError)
        return err;
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
