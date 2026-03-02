"use client";
import { useGetMenusByRestaurantQuery } from "@/redux/api/menuApi";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { MenuItem } from "@/types/menu";
import { useDispatch } from "react-redux";
import { add } from "@/redux/cartSlice";
import { toast, Toaster } from "sonner";
import { isAuthenticated } from "@/utils/auth";
import { getImageUrl } from "@/lib/utils";
import { Star } from "lucide-react";
import { useRateEntityMutation } from "@/redux/api/ratingApi";
import { useState } from "react";

const MenuItemRating = ({
  item,
  menuId,
}: {
  item: MenuItem;
  menuId: string;
}) => {
  const [rateEntity] = useRateEntityMutation();
  const [hovered, setHovered] = useState<number | null>(null);

  const handleRate = async (value: number) => {
    try {
      await rateEntity({
        entityType: "MenuItem",
        entityId: item._id + "," + menuId,
        rating: value,
      }).unwrap();
      toast.success(`Rated ${value} stars!`);
    } catch (error) {
      toast.error("Failed to rate item.");
    }
  };

  return (
    <div className="flex items-center gap-0.5 text-amber-500 text-sm">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={18}
          className="cursor-pointer"
          fill={
            hovered != null
              ? value <= hovered
                ? "currentColor"
                : "none"
              : value <= Math.round(item.rating)
              ? "currentColor"
              : "none"
          }
          stroke="currentColor"
          onMouseEnter={() => setHovered(value)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleRate(value)}
        />
      ))}
      <span className="ml-1 text-xs text-stone-500">
        ({item.rating.toFixed(1)})
      </span>
    </div>
  );
};

const MenusCarousel = ({ restaurantId }: { restaurantId: string }) => {
  const { data } = useGetMenusByRestaurantQuery(restaurantId);
  const dispatch = useDispatch();

  return (
    <div className="w-full max-w-[100vw] overflow-visible">
      {data && data.menus.length > 0 && (
        <div className="space-y-6 w-full px-2 sm:px-4">
          {data.menus.map((menu) => (
            <div key={menu._id} className="space-y-4">
              <h3 className="font-display text-2xl font-bold text-stone-800">
                {menu.menuName}
              </h3>
              <Carousel opts={{ loop: true, align: "center" }}>
                <CarouselPrevious />
                <CarouselContent className="-ml-4">
                  {menu.menuItems.map((item, index) => (
                    <CarouselItem
                      key={index}
                      className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4 p-2"
                    >
                      <Card className="h-full flex flex-col justify-between rounded-2xl overflow-hidden border border-stone-200/80 shadow-sm hover:shadow-md transition-shadow pt-0">
                        {item.itemPicture && (
                          <img
                            src={getImageUrl(item.itemPicture)}
                            alt={item.name}
                            className="w-full h-40 object-cover"
                          />
                        )}
                        <CardContent className="p-4 space-y-1 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-display text-lg font-semibold text-stone-800 truncate">
                              {item.name}
                            </h4>
                            <p className="text-sm text-stone-600 truncate">
                              {item.description}
                            </p>
                            <p className="text-sm font-bold text-stone-900">
                              ETB {item.price.toFixed(2)}
                            </p>
                            <MenuItemRating item={item} menuId={menu._id} />
                          </div>
                          <Button
                            className="mt-3 rounded-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white"
                            onClick={() => {
                              if (isAuthenticated()) {
                                dispatch(add({ item, restaurantId }));
                              } else {
                                toast.warning(
                                  "Please sign in to add items to your cart"
                                );
                              }
                            }}
                          >
                            Add to order
                          </Button>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselNext />
              </Carousel>
            </div>
          ))}
        </div>
      )}
      <Toaster />
    </div>
  );
};

export default MenusCarousel;
