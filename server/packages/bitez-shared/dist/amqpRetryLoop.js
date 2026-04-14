import amqp from "amqplib";
import { once } from "node:events";
/**
 * Runs AMQP setup in a loop: on connection close or setup failure, waits with exponential backoff and reconnects.
 */
export async function runAmqpConsumerLoop(url, logger, label, setup, options) {
    const log = logger.child({ amqpLoop: label });
    let backoffMs = 3000;
    for (;;) {
        if (options?.signal?.aborted)
            return;
        try {
            const connection = await amqp.connect(url);
            connection.on("error", (err) => log.error({ err }, "amqp connection error"));
            const onAbort = () => {
                void connection.close().catch(() => { });
            };
            if (options?.signal) {
                if (options.signal.aborted) {
                    await connection.close().catch(() => { });
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
            if (options?.signal?.aborted)
                return;
            backoffMs = 3000;
        }
        catch (err) {
            if (options?.signal?.aborted)
                return;
            log.error({ err }, "amqp consumer loop failed; retrying");
            await new Promise((r) => setTimeout(r, backoffMs));
            backoffMs = Math.min(backoffMs * 2, 60_000);
        }
    }
}
