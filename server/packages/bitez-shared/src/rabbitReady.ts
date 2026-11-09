import type { Logger } from "pino";

/**
 * Builds RabbitMQ management health URL from an AMQP URL.
 * Override with RABBITMQ_READY_URL when management host/port/creds differ.
 *
 * Example: amqp://guest:guest@rabbitmq:5672
 *       → http://guest:guest@rabbitmq:15672/api/healthchecks/node
 */
export function resolveRabbitReadyUrl(amqpUrl: string): string {
  const override = process.env.RABBITMQ_READY_URL?.trim();
  if (override) return override;

  const u = new URL(amqpUrl);
  const managementPort = process.env.RABBITMQ_MANAGEMENT_PORT?.trim() || "15672";
  const user = decodeURIComponent(u.username || "guest");
  const pass = decodeURIComponent(u.password || "guest");
  const auth =
    user || pass ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : "";
  return `http://${auth}${u.hostname}:${managementPort}/api/healthchecks/node`;
}

/**
 * Blocks until RabbitMQ's own health endpoint reports ready.
 * Does not open an AMQP connection — so services do not "knock" until the broker says done.
 */
export async function waitUntilRabbitReportsReady(
  amqpUrl: string,
  logger?: Logger,
  options?: { signal?: AbortSignal; pollMs?: number },
): Promise<void> {
  const readyUrl = resolveRabbitReadyUrl(amqpUrl);
  const pollMs = options?.pollMs ?? 2000;
  let announced = false;

  for (;;) {
    if (options?.signal?.aborted) {
      throw new Error("Aborted while waiting for RabbitMQ readiness");
    }
    try {
      const res = await fetch(readyUrl, { signal: options?.signal });
      if (res.ok) {
        if (announced) {
          logger?.info("RabbitMQ reports ready");
        }
        return;
      }
    } catch {
      // Broker/management not up yet — keep waiting silently after first notice.
    }
    if (!announced) {
      logger?.info({ readyUrl: readyUrl.replace(/\/\/.*@/, "//***@") }, "waiting for RabbitMQ to report ready");
      announced = true;
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
}
