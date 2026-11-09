import type { Channel, ConsumeMessage } from "amqplib";
import type { Logger } from "@bitez/shared";
import type { IUserReadModelRepository } from "../../domain/interfaces/UserReadModelRepository.js";
import type { DeliveryUseCase } from "../../delivery/application/usecases/DeliveryUseCase.js";
import { runAmqpConsumerLoop } from "@bitez/shared";
import { RoutingKeys } from "@bitez/contracts";

const EXCHANGE = "bitez";
const QUEUE = "order.user.registered";
const ROUTING_KEY = RoutingKeys.UserRegistered;

export function startUserRegisteredConsumer(
  url: string,
  userReadModel: IUserReadModelRepository,
  logger: Logger,
  options?: { signal?: AbortSignal; deliveryUseCase?: DeliveryUseCase },
): Promise<void> {
  const log = logger.child({ event: ROUTING_KEY, queue: QUEUE });
  return runAmqpConsumerLoop(
    url,
    logger,
    "user-registered",
    async (channel: Channel) => {
      await channel.assertExchange(EXCHANGE, "topic", { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
      channel.prefetch(1);

      await channel.consume(QUEUE, async (msg: ConsumeMessage | null) => {
        if (!msg) return;
        try {
          const p = JSON.parse(msg.content.toString()) as Record<string, unknown>;
          const userId = String(p.userId ?? p._id ?? "");
          const name = String(p.name ?? "");
          const email = String(p.email ?? "");
          const phoneNumber = p.phoneNumber != null ? String(p.phoneNumber) : undefined;
          const role = p.role != null ? String(p.role) : undefined;
          if (userId) {
            await userReadModel.upsert({ userId, name, email, phoneNumber });
            if (role === "delivery_person" && options?.deliveryUseCase) {
              await options.deliveryUseCase.createDeliveryPerson({ userId });
            }
            log.info({ userId, role }, "user.registered processed");
          }
          channel.ack(msg);
        } catch (err) {
          log.error({ err }, "user.registered consumer error");
          channel.nack(msg, false, true);
        }
      });
    },
    options,
  );
}
