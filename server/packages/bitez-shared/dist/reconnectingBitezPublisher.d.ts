/**
 * Topic publisher on the shared `bitez` exchange with reconnect on connection loss
 * and bounded backoff while RabbitMQ is unavailable.
 */
export declare class ReconnectingBitezEventPublisher {
    private readonly url;
    private channel;
    private connection;
    constructor(url: string);
    private clearRefs;
    private ensureConnected;
    publish(routingKey: string, payload: Record<string, unknown>): Promise<void>;
    close(): Promise<void>;
}
