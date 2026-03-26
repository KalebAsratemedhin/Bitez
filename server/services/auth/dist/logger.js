import pino from "pino";
const isProduction = process.env.NODE_ENV === "production";
const redactPaths = [
    "password",
    "token",
    "authorization",
    "cookie",
    "req.headers.authorization",
    "req.headers.cookie",
];
export function createLogger(options) {
    const { serviceName, level = "info", pretty = !isProduction } = options;
    const base = {
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
        }
        catch {
            // fallback to JSON
        }
    }
    return pino(base);
}
