/**
 * Logger interface exported for consumers. Self-contained so services don't need to resolve pino.
 */
export interface Logger {
    child(bindings: object): Logger;
    info(obj: object, msg?: string): void;
    info(msg: string): void;
    error(obj: object, msg?: string): void;
    error(msg: string): void;
    warn(obj: object, msg?: string): void;
    warn(msg: string): void;
    debug(obj: object, msg?: string): void;
    debug(msg: string): void;
    trace(obj: object, msg?: string): void;
    trace(msg: string): void;
}
export interface CreateLoggerOptions {
    /** Service name (e.g. "order", "delivery"). Included in every log. */
    serviceName: string;
    /** Log level: "trace" | "debug" | "info" | "warn" | "error" | "fatal". Default "info". */
    level?: string;
    /** Force pretty-print in development. Default: true when NODE_ENV !== "production". */
    pretty?: boolean;
}
/**
 * Create a structured JSON logger for a microservice.
 * - Production: JSON to stdout for log aggregators (ELK, Loki, Datadog, CloudWatch).
 * - Development: Pretty-printed to stdout when pretty is true (default).
 * Use logger.child({ event, correlationId, ... }) in consumers for context.
 */
export declare function createLogger(options: CreateLoggerOptions): Logger;
//# sourceMappingURL=index.d.ts.map