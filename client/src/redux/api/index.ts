import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  FetchBaseQueryError,
  BaseQueryFn,
  FetchArgs,
} from "@reduxjs/toolkit/query/react";
import { newClientRequestId, normalizeApiErrorBody } from "@/utils/apiError";

const url =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ?? "";

const baseQuery = fetchBaseQuery({
  baseUrl: url || undefined,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("X-Request-Id", newClientRequestId());
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

/** Flattens unified `{ error: { message, requestId } }` so `error.data.message` works for toasts. */
const baseQueryWithNormalizedErrors: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQueryWithReauth(args, api, extraOptions);
  if (result.error && result.error.data !== undefined) {
    const { message, requestId, code } = normalizeApiErrorBody(result.error.data);
    const prev = result.error.data;
    const merged =
      typeof prev === "object" && prev !== null && !Array.isArray(prev)
        ? { ...(prev as Record<string, unknown>), message, requestId, code }
        : { message, requestId, code, raw: prev };
    return { error: { ...result.error, data: merged } };
  }
  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithNormalizedErrors,
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
