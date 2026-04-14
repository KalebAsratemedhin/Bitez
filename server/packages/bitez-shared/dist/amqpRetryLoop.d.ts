import amqp from "amqplib";
import type { Logger } from "pino";
export type AmqpConsumerLoopOptions = {
    /** When aborted, stops the loop after the current connection closes. */
    signal?: AbortSignal;
};
/**
 * Runs AMQP setup in a loop: on connection close or setup failure, waits with exponential backoff and reconnects.
 */
export declare function runAmqpConsumerLoop(url: string, logger: Logger, label: string, setup: (channel: amqp.Channel) => Promise<void>, options?: AmqpConsumerLoopOptions): Promise<void>;
