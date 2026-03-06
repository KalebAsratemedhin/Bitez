import pino from "pino";
const isProduction = process.env.NODE_ENV === "production";
/**
 * Redact sensitive keys from log output. Add more paths as needed.
 */
const redactPaths = [
    "password",
    "token",
    "authorization",
    "cookie",
    "req.headers.authorization",
    "req.headers.cookie",
];
/**
 * Create a structured JSON logger for a microservice.
 * - Production: JSON to stdout for log aggregators (ELK, Loki, Datadog, CloudWatch).
 * - Development: Pretty-printed to stdout when pretty is true (default).
 * Use logger.child({ event, correlationId, ... }) in consumers for context.
 */
export function createLogger(options) {
    const { serviceName, level = "info", pretty = !isProduction } = options;
    const base = {
        level,
        base: {
            service: serviceName,
            env: process.env.NODE_ENV ?? "development",
        },
        redact: {
            paths: redactPaths,
            censor: "[REDACTED]",
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
            level: (label) => ({ level: label }),
        },
    };
    if (pretty && !isProduction) {
        try {
            const transport = pino.transport({
                targets: [
                    {
                        target: "pino-pretty",
                        options: {
                            colorize: true,
                            translateTime: "SYS:standard",
                            ignore: "pid,hostname",
                        },
                        level,
                    },
                ],
            });
            return pino({ ...base }, transport);
        }
        catch {
            // pino-pretty optional: fall back to JSON
        }
    }
    return pino(base);
}
