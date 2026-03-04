import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  FetchBaseQueryError,
  BaseQueryFn,
  FetchArgs,
} from "@reduxjs/toolkit/query/react";

const url =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ?? "";

const baseQuery = fetchBaseQuery({
  baseUrl: url || undefined,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const hadToken = !!localStorage.getItem("token");
  const result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401 && hadToken) {
    localStorage.clear();
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: [
    "users",
    "current-user",
    "Menu",
    "Menus",
    "order",
    "my-orders",
    "all-orders",
    "restaurant-orders",
    "my-restaurants",
    "a-restaurant",
    "all-restaurants",
    "active-restaurants",
    "delivery-person-deliveries",
    "all-deliveries",
    "customer-deliveries",
    "Notifications",
    "customer-dashboard",
    "admin-dashboard",
    "delivery-person-dashboard",
    "owner-dashboard",
    "restaurant-dashboard",
    "Rating",
    "top-restaurants",
    "top-menu-items",
  ],
});
