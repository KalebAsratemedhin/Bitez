import pino, { type LoggerOptions } from "pino";

const isProduction = process.env.NODE_ENV === "production";

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
export function createLogger(options: CreateLoggerOptions): Logger {
  const { serviceName, level = "info", pretty = !isProduction } = options;

  const base: LoggerOptions = {
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
      return pino({ ...base }, transport) as unknown as Logger;
    } catch {
      // pino-pretty optional: fall back to JSON
    }
  }

  return pino(base) as unknown as Logger;
}
