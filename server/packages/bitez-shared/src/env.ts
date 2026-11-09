export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** JWT signing/verify secret. Requires JWT_SECRET in production. */
export function resolveJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (isProduction()) {
    throw new Error("JWT_SECRET is required when NODE_ENV=production");
  }
  return "dev-secret";
}

/**
 * Mongo connection string. Prefer MONGODB_URI (or MONGO_URI).
 * In non-production only, falls back to localhost with `fallbackDbName`
 * (never a shared bitez_default).
 */
export function resolveMongoUri(fallbackDbName: string): string {
  const fromEnv = process.env.MONGODB_URI?.trim() || process.env.MONGO_URI?.trim();
  if (fromEnv) return fromEnv;
  if (isProduction()) {
    throw new Error("MONGODB_URI is required when NODE_ENV=production");
  }
  return `mongodb://localhost:27017/${fallbackDbName}`;
}

/** RabbitMQ URL. Requires RABBITMQ_URL in production. */
export function resolveRabbitMqUrl(): string {
  const fromEnv = process.env.RABBITMQ_URL?.trim();
  if (fromEnv) return fromEnv;
  if (isProduction()) {
    throw new Error("RABBITMQ_URL is required when NODE_ENV=production");
  }
  return "amqp://guest:guest@localhost:5672";
}

/**
 * Fail fast in production when critical secrets are missing.
 * Call once at process start from each service composition root.
 */
export function assertProductionSecrets(extraRequired: string[] = []): void {
  if (!isProduction()) return;
  const required = ["MONGODB_URI", "JWT_SECRET", "RABBITMQ_URL", "INTERNAL_SERVICE_TOKEN", ...extraRequired];
  const missing = required.filter((name) => {
    if (name === "MONGODB_URI") {
      return !process.env.MONGODB_URI?.trim() && !process.env.MONGO_URI?.trim();
    }
    return !process.env[name]?.trim();
  });
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(", ")}`);
  }
}
