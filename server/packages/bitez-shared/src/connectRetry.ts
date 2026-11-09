/**
 * Retries a connection setup with exponential backoff.
 * Used when a service image may start before Mongo/Rabbit (or during broker restarts)
 * without relying on orchestrator startup ordering.
 */
export async function withConnectRetry<T>(
  connect: () => Promise<T>,
  options?: {
    label?: string;
    signal?: AbortSignal;
    initialBackoffMs?: number;
    maxBackoffMs?: number;
    onRetry?: (err: unknown, backoffMs: number) => void;
  },
): Promise<T> {
  const label = options?.label ?? "connect";
  let backoffMs = options?.initialBackoffMs ?? 2000;
  const maxBackoffMs = options?.maxBackoffMs ?? 30_000;

  for (;;) {
    if (options?.signal?.aborted) {
      throw new Error(`${label} aborted before connecting`);
    }
    try {
      return await connect();
    } catch (err) {
      if (options?.signal?.aborted) {
        throw new Error(`${label} aborted before connecting`);
      }
      options?.onRetry?.(err, backoffMs);
      await new Promise((r) => setTimeout(r, backoffMs));
      backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
    }
  }
}
