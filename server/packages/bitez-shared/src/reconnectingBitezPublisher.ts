import amqp, { type ChannelModel } from "amqplib";
import {
  BITEZ_EXCHANGE,
  BITEZ_EXCHANGE_TYPE,
  type EventPayloadMap,
  type ITypedEventPublisher,
  type RoutingKey,
} from "@bitez/contracts";
import { waitUntilRabbitReportsReady } from "./rabbitReady.js";

const EXCHANGE = BITEZ_EXCHANGE;
const EXCHANGE_TYPE = BITEZ_EXCHANGE_TYPE;

/**
 * Topic publisher on the shared `bitez` exchange with reconnect on connection loss
 * and bounded backoff while RabbitMQ is unavailable.
 * First connect waits until RabbitMQ's health endpoint reports ready.
 */
export class ReconnectingBitezEventPublisher implements ITypedEventPublisher {
  private channel: amqp.Channel | null = null;
  private connection: ChannelModel | null = null;
  private readyGate: Promise<void> | null = null;

  constructor(private readonly url: string) {}

  private clearRefs(): void {
    this.channel = null;
    this.connection = null;
  }

  private async ensureReady(): Promise<void> {
    if (!this.readyGate) {
      this.readyGate = waitUntilRabbitReportsReady(this.url);
    }
    await this.readyGate;
  }

  private async ensureConnected(): Promise<amqp.Channel> {
    if (this.channel) return this.channel;
    await this.ensureReady();
    let backoffMs = 2000;
    for (;;) {
      try {
        const conn = await amqp.connect(this.url);
        this.connection = conn;
        conn.on("error", () => this.clearRefs());
        conn.on("close", () => this.clearRefs());
        const ch = await conn.createChannel();
        await ch.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
        this.channel = ch;
        return ch;
      } catch {
        await new Promise((r) => setTimeout(r, backoffMs));
        backoffMs = Math.min(backoffMs * 2, 30_000);
        this.clearRefs();
      }
    }
  }

  async publish<K extends RoutingKey>(
    routingKey: K,
    payload: EventPayloadMap[K],
  ): Promise<void> {
    const body = Buffer.from(JSON.stringify(payload));
    for (let attempt = 0; attempt < 2; attempt++) {
      const ch = await this.ensureConnected();
      try {
        const ok = ch.publish(EXCHANGE, routingKey, body, { persistent: true });
        if (!ok) throw new Error("Publish buffer full");
        return;
      } catch {
        this.clearRefs();
      }
    }
    throw new Error("Publish failed after reconnect");
  }

  async close(): Promise<void> {
    try {
      if (this.channel) await this.channel.close();
    } catch {
      /* ignore */
    }
    try {
      if (this.connection) await this.connection.close();
    } catch {
      /* ignore */
    } finally {
      this.clearRefs();
    }
  }
}
