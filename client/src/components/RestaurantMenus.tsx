import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetAllMineRestaurantQuery } from "@/redux/api/restaurantApi";
import { useGetMenusByRestaurantQuery } from "@/redux/api/menuApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import CreateMenuForm from "@/components/CreateMenuForm";
import { getImageUrl } from "@/lib/utils";
import { UtensilsCrossed } from "lucide-react";

type RestaurantMenusProps = {
  /** When set, show menus for this restaurant only and hide the restaurant selector. */
  initialRestaurantId?: string | null;
};

const RestaurantMenusWithCreate = ({ initialRestaurantId }: RestaurantMenusProps) => {
  const [internalRestaurantId, setInternalRestaurantId] = useState<string | null>(null);
  const selectedRestaurantId = initialRestaurantId ?? internalRestaurantId;
  const router = useRouter();

  const {
    data: restaurantsData,
    isLoading: isLoadingRestaurants,
    isError: isRestaurantError,
  } = useGetAllMineRestaurantQuery({ page: 1, limit: 100 });

  const {
    data: menus,
    isLoading: isLoadingMenus,
    isError: isMenusError,
  } = useGetMenusByRestaurantQuery(selectedRestaurantId!, {
    skip: !selectedRestaurantId,
  });

  if (isRestaurantError) toast.error("Failed to load restaurants");
  if (isMenusError) toast.error("Failed to load menus");

  const showSelector = initialRestaurantId === undefined;
  const selectedRestaurant = restaurantsData?.data?.find(
    (r) => r._id === selectedRestaurantId
  );

  return (
    <div className="space-y-6">
      {showSelector && (
        <div>
          <h2 className="text-xl font-semibold text-stone-800">Select Restaurant</h2>
          <Select onValueChange={(value) => setInternalRestaurantId(value)}>
            <SelectTrigger className="mt-2 rounded-xl">
              <SelectValue
                placeholder={
                  isLoadingRestaurants ? "Loading..." : "Select Restaurant"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {restaurantsData?.data?.map((restaurant) => (
                <SelectItem key={restaurant._id} value={restaurant._id}>
                  <div className="flex items-center gap-2">
                    {restaurant.logo ? (
                      <img
                        src={getImageUrl(restaurant.logo)}
                        alt=""
                        className="h-6 w-6 rounded object-cover shrink-0"
                      />
                    ) : (
                      <span className="h-6 w-6 rounded bg-stone-200 flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="h-3 w-3 text-stone-400" />
                      </span>
                    )}
                    <span>{restaurant.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedRestaurant && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
              {selectedRestaurant.logo ? (
                <img
                  src={getImageUrl(selectedRestaurant.logo)}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover border border-stone-200"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-stone-200 flex items-center justify-center">
                  <UtensilsCrossed className="h-6 w-6 text-stone-400" />
                </div>
              )}
              <span className="font-medium text-stone-800">{selectedRestaurant.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Menus List */}
      {selectedRestaurantId && (
        <div className="space-y-4">
          {showSelector && <h2 className="text-xl font-semibold text-stone-800">Menus</h2>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingMenus ? (
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))
            ) : menus?.menus.length === 0 ? (
              <p className="text-gray-500 col-span-full">
                No menus found for this restaurant.
              </p>
            ) : (
              menus?.menus.map((menu: any) => (
                <Card
                  key={menu._id}
                  onClick={() => router.push(`/menu/${menu._id}`)}
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 "
                >
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      {menu.menuName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Click to view details
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Menu Creation */}
      {selectedRestaurantId && (
        <div className="pt-6 border-t border-stone-200">
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Create New Menu</h2>
          <CreateMenuForm
            selectedRestaurantId={selectedRestaurantId}
            onCreated={() => {
              toast.success("Menu created! Refreshing...");
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RestaurantMenusWithCreate;
