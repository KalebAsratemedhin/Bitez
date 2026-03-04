import { findOrdersByCustomerId, findRestaurantsByOwnerId, findOrdersByRestaurantIds, findDeliveriesByDeliveryPersonUserId, getRestaurantNamesByIds, } from "./ReadModelRepositories.js";
export function createDashboardReadModelsAdapter() {
    return {
        findOrdersByCustomerId,
        findRestaurantsByOwnerId,
        findOrdersByRestaurantIds,
        findDeliveriesByDeliveryPersonUserId,
        getRestaurantNamesByIds,
    };
}
