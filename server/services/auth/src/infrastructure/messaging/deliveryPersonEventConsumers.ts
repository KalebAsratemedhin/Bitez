import type { Channel, ConsumeMessage } from "amqplib";
import {
  BITEZ_EXCHANGE,
  BITEZ_EXCHANGE_TYPE,
  RoutingKeys,
  type DeliveryPersonRatingUpdatedEvent,
  type DeliveryPersonRegisteredEvent,
} from "@bitez/contracts";
import { runAmqpConsumerLoop, type Logger } from "@bitez/shared";
import type { IDeliveryPersonRepository } from "../../domain/interfaces/DeliveryPersonRepository.js";

export function startAuthDeliveryPersonEventConsumers(
  url: string,
  readModel: IDeliveryPersonRepository,
  logger: Logger,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const log = logger.child({ component: "authDeliveryPersonEvents" });
  return runAmqpConsumerLoop(
    url,
    logger,
    "auth-delivery-person-events",
    async (channel: Channel) => {
      await channel.assertExchange(BITEZ_EXCHANGE, BITEZ_EXCHANGE_TYPE, { durable: true });

      const registeredQueue = "auth.delivery_person.registered";
      await channel.assertQueue(registeredQueue, { durable: true });
      await channel.bindQueue(registeredQueue, BITEZ_EXCHANGE, RoutingKeys.DeliveryPersonRegistered);
      await channel.consume(registeredQueue, async (msg: ConsumeMessage | null) => {
        if (!msg) return;
        try {
          const payload = JSON.parse(msg.content.toString()) as DeliveryPersonRegisteredEvent;
          if (payload.userId && payload.deliveryPersonId) {
            await readModel.upsertRegistration({
              userId: String(payload.userId),
              deliveryPersonId: String(payload.deliveryPersonId),
            });
            log.info(
              { userId: payload.userId, deliveryPersonId: payload.deliveryPersonId },
              "delivery_person.registered projected",
            );
          }
          channel.ack(msg);
        } catch (err) {
          log.error({ err }, "delivery_person.registered consumer error");
          channel.nack(msg, false, true);
        }
      });

      const ratingQueue = "auth.delivery_person.rating.updated";
      await channel.assertQueue(ratingQueue, { durable: true });
      await channel.bindQueue(ratingQueue, BITEZ_EXCHANGE, RoutingKeys.DeliveryPersonRatingUpdated);
      channel.prefetch(1);
      await channel.consume(ratingQueue, async (msg: ConsumeMessage | null) => {
        if (!msg) return;
        try {
          const payload = JSON.parse(msg.content.toString()) as DeliveryPersonRatingUpdatedEvent;
          if (payload.deliveryPersonId != null && typeof payload.averageRating === "number") {
            await readModel.updateRatingByDeliveryPersonId(
              String(payload.deliveryPersonId),
              payload.averageRating,
            );
            log.info(
              {
                deliveryPersonId: payload.deliveryPersonId,
                averageRating: payload.averageRating,
              },
              "delivery_person.rating.updated projected",
            );
          }
          channel.ack(msg);
        } catch (err) {
          log.error({ err }, "delivery_person.rating.updated consumer error");
          channel.nack(msg, false, true);
        }
      });
    },
    options,
  );
}
