/** RabbitMQ topic exchange used by all Bitez services. */
export const BITEZ_EXCHANGE = "bitez" as const;
export const BITEZ_EXCHANGE_TYPE = "topic" as const;

/** Canonical routing keys. Prefer these over string literals. */
export const RoutingKeys = {
  RestaurantCreated: "restaurant.created",
  RestaurantUpdated: "restaurant.updated",
  OrderCreated: "order.created",
  OrderUpdated: "order.updated",
  OrderReadyForDelivery: "order.ready_for_delivery",
  DeliveryCreated: "delivery.created",
  DeliveryUpdated: "delivery.updated",
  DeliveryDelivered: "delivery.delivered",
  DeliveryPersonRegistered: "delivery_person.registered",
  DeliveryPersonRatingUpdated: "delivery_person.rating.updated",
  NotificationRequested: "notification.requested",
} as const;

export type RoutingKey = (typeof RoutingKeys)[keyof typeof RoutingKeys];

export interface RestaurantCreatedEvent {
  restaurantId: string;
  name: string;
  ownerId: string;
  status?: string;
  [key: string]: unknown;
}

export interface RestaurantUpdatedEvent {
  restaurantId: string;
  [key: string]: unknown;
}

export interface OrderCreatedEvent {
  orderId: string;
  customerId: string;
  restaurantId: string;
  totalAmount: number;
  status: string;
  createdAt: Date | string;
  deliveryAddress?: string;
  coordinates?: { lat?: number; lng?: number };
}

export interface OrderUpdatedEvent {
  orderId: string;
  customerId: string;
  restaurantId: string;
  totalAmount: number;
  status: string;
  createdAt: Date | string;
}

export interface OrderReadyForDeliveryEvent {
  orderId: string;
  customerId: string;
  restaurantId: string;
  estimatedDeliveryTime: string;
  deliveryAddress?: string;
  coordinates?: { lat?: number; lng?: number };
}

export interface DeliveryCreatedEvent {
  deliveryId: string;
  orderId: string;
  deliveryPersonUserId: string;
  status: string;
  createdAt: Date | string;
}

export interface DeliveryUpdatedEvent {
  deliveryId: string;
  orderId: string;
  deliveryPersonUserId: string;
  status: string;
  createdAt: Date | string;
}

export interface DeliveryDeliveredEvent {
  deliveryId: string;
  orderId: string;
  deliveryPersonId: string;
  customerId: string;
}

export interface DeliveryPersonRegisteredEvent {
  deliveryPersonId: string;
  userId: string;
}

export interface DeliveryPersonRatingUpdatedEvent {
  deliveryPersonId: string;
  averageRating: number;
  /** Optional; present when the producer knows the owning user. */
  userId?: string;
}

export interface NotificationRequestedEvent {
  userId: string;
  message: string;
  type?: string;
}

export interface EventPayloadMap {
  [RoutingKeys.RestaurantCreated]: RestaurantCreatedEvent;
  [RoutingKeys.RestaurantUpdated]: RestaurantUpdatedEvent;
  [RoutingKeys.OrderCreated]: OrderCreatedEvent;
  [RoutingKeys.OrderUpdated]: OrderUpdatedEvent;
  [RoutingKeys.OrderReadyForDelivery]: OrderReadyForDeliveryEvent;
  [RoutingKeys.DeliveryCreated]: DeliveryCreatedEvent;
  [RoutingKeys.DeliveryUpdated]: DeliveryUpdatedEvent;
  [RoutingKeys.DeliveryDelivered]: DeliveryDeliveredEvent;
  [RoutingKeys.DeliveryPersonRegistered]: DeliveryPersonRegisteredEvent;
  [RoutingKeys.DeliveryPersonRatingUpdated]: DeliveryPersonRatingUpdatedEvent;
  [RoutingKeys.NotificationRequested]: NotificationRequestedEvent;
}

/** Typed publish helper signature for service EventPublisher ports. */
export type TypedEventPublish = <K extends RoutingKey>(
  routingKey: K,
  payload: EventPayloadMap[K],
) => Promise<void>;
