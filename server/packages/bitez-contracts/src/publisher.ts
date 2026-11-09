import type { EventPayloadMap, RoutingKey } from "./events.js";

/**
 * Port for publishing Bitez domain events with payload typing by routing key.
 * Infrastructure adapters (e.g. RabbitMQ) implement this.
 */
export interface ITypedEventPublisher {
  publish: <K extends RoutingKey>(
    routingKey: K,
    payload: EventPayloadMap[K],
  ) => Promise<void>;
}
