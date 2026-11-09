import type { Logger } from "pino";

export type RabbitReadyTarget = {
  url: string;
  /** Basic auth header value when management requires credentials. */
  authorization?: string;
};

/**
 * Builds RabbitMQ management health request from an AMQP URL.
 * Override with RABBITMQ_READY_URL (no credentials in URL — Node fetch forbids them).
 *
 * Example: amqp://guest:guest@rabbitmq:5672
 *       → GET http://rabbitmq:15672/api/healthchecks/node
 *         Authorization: Basic ...
 */
export function resolveRabbitReadyTarget(amqpUrl: string): RabbitReadyTarget {
  const override = process.env.RABBITMQ_READY_URL?.trim();
  if (override) {
    return { url: override };
  }

  const u = new URL(amqpUrl);
  const managementPort = process.env.RABBITMQ_MANAGEMENT_PORT?.trim() || "15672";
  const user = decodeURIComponent(u.username || "guest");
  const pass = decodeURIComponent(u.password || "guest");
  const url = `http://${u.hostname}:${managementPort}/api/healthchecks/node`;
  const authorization =
    user || pass
      ? `Basic ${Buffer.from(`${user}:${pass}`, "utf8").toString("base64")}`
      : undefined;
  return { url, authorization };
}

/** @deprecated use resolveRabbitReadyTarget */
export function resolveRabbitReadyUrl(amqpUrl: string): string {
  return resolveRabbitReadyTarget(amqpUrl).url;
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
  const target = resolveRabbitReadyTarget(amqpUrl);
  const pollMs = options?.pollMs ?? 2000;
  let announced = false;

  for (;;) {
    if (options?.signal?.aborted) {
      throw new Error("Aborted while waiting for RabbitMQ readiness");
    }
    try {
      const headers: Record<string, string> = {};
      if (target.authorization) {
        headers.Authorization = target.authorization;
      }
      const res = await fetch(target.url, { signal: options?.signal, headers });
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
      logger?.info({ readyUrl: target.url }, "waiting for RabbitMQ to report ready");
      announced = true;
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
}
