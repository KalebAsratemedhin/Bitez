import amqp, { type ChannelModel } from "amqplib";
import type { IEventPublisher } from "../../domain/interfaces/EventPublisher.js";

const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";

export class RabbitMQEventPublisher implements IEventPublisher {
  private channel: amqp.Channel | null = null;
  private connection: ChannelModel | null = null;

  constructor(private readonly url: string) {}

  async connect(): Promise<void> {
    if (this.channel) return;
    const conn = await amqp.connect(this.url);
    this.connection = conn;
    this.channel = await conn.createChannel();
    await this.channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
  }

  async publish(routingKey: string, payload: Record<string, unknown>): Promise<void> {
    await this.connect();
    if (!this.channel) throw new Error("Channel not ready");
    const published = this.channel.publish(
      EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true },
    );
    if (!published) throw new Error("Publish buffer full");
  }
}
