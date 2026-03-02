import { Restaurant } from "@/types/restaurant";
import { api } from ".";
import { PopulatedMenuItem } from "@/types/menu";


export const ratingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    rateEntity: builder.mutation({
      query: ({ entityType, entityId, rating }) => ({
        url: `/rating/${entityType}/${entityId}`,
        method: "PUT",
        body: { rating },
      }),
      invalidatesTags: (_result, _err, { entityType, entityId }) => {
        const tags: Array<
          | { type: "Rating"; id: string }
          | { type: "top-restaurants"; id?: void }
          | { type: "a-restaurant"; id: string }
          | "customer-deliveries"
        > = [{ type: "Rating", id: `${entityType}:${entityId}` }];
        if (String(entityType).toLowerCase() === "restaurant") {
          tags.push("top-restaurants");
          tags.push({ type: "a-restaurant", id: entityId });
        }
        if (String(entityType).toLowerCase() === "delivery_person") {
          tags.push("customer-deliveries");
        }
        return tags;
      },
    }),
    getRatingForEntity: builder.query<{ rating: number }, { entityType: string; entityId: string }>({
      query: ({ entityType, entityId }) => `/rating/${entityType}/${entityId}`,
      providesTags: (_result, _err, { entityType, entityId }) => [
        { type: "Rating" as const, id: `${entityType}:${entityId}` },
      ],
    }),
    getTopRestaurants: builder.query<Restaurant[], void>({
      query: () => "/rating/top/restaurants",
      providesTags: ["top-restaurants"],
    }),
    getTopMenuItems: builder.query<PopulatedMenuItem[], void>({
      query: () => "/rating/top/menu-items",
    }),
  }),
});


export const {
  useRateEntityMutation,
  useGetRatingForEntityQuery,
  useGetTopRestaurantsQuery,
  useGetTopMenuItemsQuery,
} = ratingApi;