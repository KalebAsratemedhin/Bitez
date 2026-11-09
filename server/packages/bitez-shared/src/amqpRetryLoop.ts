import amqp from "amqplib";
import { once } from "node:events";
import type { Logger } from "pino";
import { waitUntilRabbitReportsReady } from "./rabbitReady.js";

export type AmqpConsumerLoopOptions = {
  /** When aborted, stops the loop after the current connection closes. */
  signal?: AbortSignal;
};

/**
 * Runs AMQP setup in a loop: on connection close or setup failure, waits with exponential backoff and reconnects.
 * First connection waits until RabbitMQ's own health endpoint says ready (no AMQP knocks before that).
 */
export async function runAmqpConsumerLoop(
  url: string,
  logger: Logger,
  label: string,
  setup: (channel: amqp.Channel) => Promise<void>,
  options?: AmqpConsumerLoopOptions,
): Promise<void> {
  const log = logger.child({ amqpLoop: label });
  await waitUntilRabbitReportsReady(url, log, { signal: options?.signal });
  let backoffMs = 3000;
  for (;;) {
    if (options?.signal?.aborted) return;
    try {
      const connection = await amqp.connect(url);
      connection.on("error", (err) => log.error({ err }, "amqp connection error"));

      const onAbort = () => {
        void connection.close().catch(() => {});
      };
      if (options?.signal) {
        if (options.signal.aborted) {
          await connection.close().catch(() => {});
          return;
        }
        options.signal.addEventListener("abort", onAbort, { once: true });
      }

      const channel = await connection.createChannel();
      await setup(channel);
      await once(connection, "close");
      if (options?.signal) {
        options.signal.removeEventListener("abort", onAbort);
      }
      if (options?.signal?.aborted) return;
      backoffMs = 3000;
    } catch (err) {
      if (options?.signal?.aborted) return;
      // Expected when the broker is still booting or briefly unavailable;
      // warn (not error) so deploy/restart noise does not look like a crash.
      log.warn({ err }, "amqp consumer loop failed; retrying");
      await new Promise((r) => setTimeout(r, backoffMs));
      backoffMs = Math.min(backoffMs * 2, 60_000);
    }
  }
}
