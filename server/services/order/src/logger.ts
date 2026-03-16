import pino, { type LoggerOptions } from "pino";

const isProduction = process.env.NODE_ENV === "production";

export type Logger = pino.Logger;

export interface CreateLoggerOptions {
  serviceName: string;
  level?: string;
  pretty?: boolean;
}

const redactPaths = [
  "password",
  "token",
  "authorization",
  "cookie",
  "req.headers.authorization",
  "req.headers.cookie",
];

export function createLogger(options: CreateLoggerOptions): Logger {
  const { serviceName, level = "info", pretty = !isProduction } = options;
  const base: LoggerOptions = {
    level,
    base: {
      service: serviceName,
      env: process.env.NODE_ENV ?? "development",
    },
    redact: { paths: redactPaths, censor: "[REDACTED]" },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label) => ({ level: label }) },
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
    } catch {
      // fallback to JSON
    }
  }
  return pino(base);
}
