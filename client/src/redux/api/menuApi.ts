import { MenuResponse } from '@/types/menu';
import { api } from '.';


export const menuApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createMenu: builder.mutation({
      query: ({ restaurantId, formData }) => ({
        url: `/restaurant/menu/createMenu/${restaurantId}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Menus"],
    }),
    
    getMenusByRestaurant: builder.query<MenuResponse, string>({
      query: (restaurantId) => `/restaurant/menu/getMenu/${restaurantId}`,
      providesTags: ['Menus'],
    }),

    getMenuById: builder.query({
      query: (id: string) => `/restaurant/menu/${id}`,
      providesTags: ['Menu'],
    }),

    updateMenu: builder.mutation({
      query: ({ menuId, formData}) => (
        {
          url: `/restaurant/menu/updateMenu/${menuId}`,
          method: 'PUT',
          body: formData
      }),
      invalidatesTags: ['Menus', 'Menu'],
    }),

    deleteMenu: builder.mutation({
      query: (menuId: string) => ({
        url: `/restaurant/menu/deleteMenu/${menuId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Menu', 'Menus'],
    }),
  }),
});


export const {
  useCreateMenuMutation,
  useGetMenusByRestaurantQuery,
  useGetMenuByIdQuery,
  useUpdateMenuMutation,
  useDeleteMenuMutation,
} = menuApi;