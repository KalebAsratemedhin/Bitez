import type { IDashboardReadModels } from "../../application/ports/IDashboardReadModels.js";
import {
  findOrdersByCustomerId,
  findRestaurantsByOwnerId,
  findOrdersByRestaurantIds,
  findDeliveriesByDeliveryPersonUserId,
  getRestaurantNamesByIds,
} from "./ReadModelRepositories.js";

export function createDashboardReadModelsAdapter(): IDashboardReadModels {
  return {
    findOrdersByCustomerId,
    findRestaurantsByOwnerId,
    findOrdersByRestaurantIds,
    findDeliveriesByDeliveryPersonUserId,
    getRestaurantNamesByIds,
  };
}
