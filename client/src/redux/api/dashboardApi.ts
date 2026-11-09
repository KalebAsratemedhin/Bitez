import {
  AdminDashboard,
  CustomerDashboard,
  DashboardData,
  RestaurantDashboard,
} from "@/types/dashboard";
import { api } from ".";

// Paths follow owning services; `/dashboard/*` gateway proxy is gone.
// Admin aggregate has no backend equivalent yet — hook kept for UI only.
export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCustomerDashboard: builder.query<CustomerDashboard, void>({
      query: () => ({
        url: `/order/dashboard/customer`,
        method: "GET",
      }),
      providesTags: ["customer-dashboard"],
    }),
    getAdminDashboard: builder.query<AdminDashboard, void>({
      query: () => ({
        url: `/dashboard/admin`,
        method: "GET",
      }),
      providesTags: ["admin-dashboard"],
    }),
    getRestaurantOwnerDashboard: builder.query<RestaurantDashboard, void>({
      query: () => ({
        url: `/restaurant/dashboard/owner`,
        method: "GET",
      }),
      providesTags: ["restaurant-dashboard"],
    }),
    getDeliveryDashboard: builder.query<DashboardData, void>({
      query: () => `/delivery/delivery-person/dashboard`,
    }),
  }),
});

export const {
  useGetCustomerDashboardQuery,
  useGetAdminDashboardQuery,
  useGetRestaurantOwnerDashboardQuery,
  useGetDeliveryDashboardQuery,
} = dashboardApi;
