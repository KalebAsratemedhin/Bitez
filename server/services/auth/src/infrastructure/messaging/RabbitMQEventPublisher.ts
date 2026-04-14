import type { IEventPublisher } from "../../domain/interfaces/EventPublisher.js";
import { ReconnectingBitezEventPublisher } from "@bitez/shared";

export class RabbitMQEventPublisher extends ReconnectingBitezEventPublisher implements IEventPublisher {}
