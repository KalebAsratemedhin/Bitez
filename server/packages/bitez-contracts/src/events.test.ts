import { describe, expect, it } from "vitest";
import { RoutingKeys } from "./events.js";

describe("RoutingKeys", () => {
  it("uses stable dotted routing key names", () => {
    expect(RoutingKeys.UserRegistered).toBe("user.registered");
    expect(RoutingKeys.OrderReadyForDelivery).toBe("order.ready_for_delivery");
    expect(RoutingKeys.DeliveryPersonRegistered).toBe("delivery_person.registered");
    expect(RoutingKeys.DeliveryPersonRatingUpdated).toBe("delivery_person.rating.updated");
  });

  it("has unique values", () => {
    const values = Object.values(RoutingKeys);
    expect(new Set(values).size).toBe(values.length);
  });
});
