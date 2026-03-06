import amqp from "amqplib";
import type { Logger } from "@bitez/logger";
import type { DeliveryUseCase } from "../../application/usecases/DeliveryUseCase.js";
import type { IUserReadModelRepository } from "../../domain/interfaces/UserReadModelRepository.js";

const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "delivery.user.registered";
const ROUTING_KEY = "user.registered";

export async function startUserRegisteredConsumer(
  url: string,
  deliveryUseCase: DeliveryUseCase,
  userReadModelRepository: IUserReadModelRepository | undefined,
  logger: Logger
): Promise<() => Promise<void>> {
  const log = logger.child({ event: ROUTING_KEY, queue: QUEUE });
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
  channel.prefetch(1);

  // Idempotent: createDeliveryPerson is upsert by userId; user read model upsert by userId.
  await channel.consume(QUEUE, async (msg: amqp.ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString()) as {
        userId?: string;
        role?: string;
        name?: string;
        email?: string;
        phoneNumber?: string;
      };
      if (payload.userId) {
        if (payload.role === "delivery_person") {
          await deliveryUseCase.createDeliveryPerson({ userId: String(payload.userId) });
        }
        if (userReadModelRepository) {
          await userReadModelRepository.upsert({
            userId: String(payload.userId),
            name: String(payload.name ?? ""),
            email: String(payload.email ?? ""),
            phoneNumber: payload.phoneNumber != null ? String(payload.phoneNumber) : undefined,
          });
        }
        log.info({ userId: payload.userId }, "user.registered processed");
      }
      channel.ack(msg);
    } catch (err) {
      log.error({ err }, "user.registered consumer error");
      channel.nack(msg, false, true);
    }
  });

  return async () => {
    await channel.close();
    await connection.close();
  };
}
