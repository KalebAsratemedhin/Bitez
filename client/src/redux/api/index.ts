import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  FetchBaseQueryError,
  BaseQueryFn,
  FetchArgs,
} from "@reduxjs/toolkit/query/react";

const url =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ?? "";

if (typeof window !== "undefined" && !url) {
  console.warn("[API] NEXT_PUBLIC_API_URL is not set. Requests will go to the current origin.");
}

const baseQuery = fetchBaseQuery({
  baseUrl: url || undefined,
  prepareHeaders: (headers, { endpoint }) => {
    const token = localStorage.getItem("token");
    const path = typeof endpoint === "string" ? endpoint : "";
    console.log("[API] prepareHeaders", { endpoint: path, hasToken: !!token, tokenLength: token?.length ?? 0 });
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
  const requestUrl = typeof args === "string" ? args : (args as FetchArgs).url ?? "";
  console.log("[API] request", { url: requestUrl, hadToken });
  const result = await baseQuery(args, api, extraOptions);
  const status = result.error?.status ?? (result.data !== undefined ? 200 : 0);
  console.log("[API] response", { url: requestUrl, status, error: result.error?.status });

  // Only clear when we sent a token and got 401 (token was rejected)
  if (result.error && result.error.status === 401 && hadToken) {
    console.warn("[API] 401 with token – clearing localStorage");
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
    "top-restaurants"
  ],
});
