import amqp from "amqplib";
import type { Logger } from "../../logger.js";
import type { DeliveryPersonRepository } from "../repositories/DeliveryPersonRepository.js";

const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "delivery.person.rating.updated";
const ROUTING_KEY = "delivery_person.rating.updated";

export async function startDeliveryPersonRatingUpdatedConsumer(
  url: string,
  deliveryPersonRepository: DeliveryPersonRepository,
  logger: Logger,
): Promise<() => Promise<void>> {
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
  channel.prefetch(1);
  const log = logger.child({ event: ROUTING_KEY, queue: QUEUE });

  await channel.consume(QUEUE, async (msg: amqp.ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString()) as {
        deliveryPersonId?: string;
        averageRating?: number;
      };
      if (payload.deliveryPersonId != null && typeof payload.averageRating === "number") {
        await deliveryPersonRepository.updateRating(
          String(payload.deliveryPersonId),
          payload.averageRating,
        );
      }
      log.info(
        { deliveryPersonId: payload.deliveryPersonId, averageRating: payload.averageRating },
        "delivery_person.rating.updated processed",
      );
      channel.ack(msg);
    } catch (err) {
      log.error(
        {
          err,
          msg: {
            consumerTag: msg.fields.consumerTag,
            deliveryTag: msg.fields.deliveryTag,
            redelivered: msg.fields.redelivered,
            exchange: msg.fields.exchange,
            routingKey: msg.fields.routingKey,
            messageId: msg.properties.messageId,
            correlationId: msg.properties.correlationId,
          },
        },
        "delivery_person.rating.updated consumer error",
      );
      channel.nack(msg, false, true);
    }
  });

  return async () => {
    await channel.close();
    await connection.close();
  };
}
