"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useGetTopMenuItemsQuery, useRateEntityMutation } from "@/redux/api/ratingApi";
import { useDispatch } from "react-redux";
import { add } from "@/redux/cartSlice";
import { toast, Toaster } from "sonner";
import { isAuthenticated } from "@/utils/auth";
import { Star, Loader2 } from "lucide-react";
import { useState } from "react";
import { MenuItem } from "@/types/menu";
import Link from "next/link";


function MenuItemRating({ item }: { item: MenuItem }) {
  const [rateEntity] = useRateEntityMutation();
  const [hovered, setHovered] = useState<number | null>(null);

  const handleRate = async (value: number) => {
    try {
      await rateEntity({
        entityType: "MenuItem",
        entityId: item._id,
        rating: value,
      }).unwrap();
      toast.success(`Rated ${value} stars!`);
    } catch {
      toast.error("Failed to rate item.");
    }
  };

  return (
    <div className="flex items-center gap-1 text-amber-500 text-sm">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={16}
          className="cursor-pointer"
          fill={
            hovered != null
              ? value <= hovered
                ? "#f59e0b"
                : "none"
              : value <= Math.round(item.rating)
                ? "#f59e0b"
                : "none"
          }
          stroke="#f59e0b"
          onMouseEnter={() => setHovered(value)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleRate(value)}
        />
      ))}
      <span className="ml-1 text-xs text-stone-500">({item.rating.toFixed(1)})</span>
    </div>
  );
}


export default function TopMenuItems() {
  const { data, isLoading, error } = useGetTopMenuItemsQuery();
  const dispatch = useDispatch();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  if (error) return <p className="text-red-500 py-8">Failed to load menu items.</p>;

  return (
    <>
      <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselPrevious className="left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 border-0 bg-white/95 shadow-md hover:bg-white transition-all duration-300 hover:scale-105" />
        <CarouselNext className="right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 border-0 bg-white/95 shadow-md hover:bg-white transition-all duration-300 hover:scale-105" />
        <CarouselContent className="-ml-3 md:-ml-4">
          {data?.map((item) => (
            <CarouselItem key={item._id} className="pl-3 md:pl-4 basis-[260px] md:basis-[280px] lg:basis-[300px]">
              <div className="group h-full flex flex-col transition-transform duration-300 hover:scale-[1.02]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100 shadow-md transition-shadow duration-300 group-hover:shadow-xl">
                  <img
                    src={item?.itemPicture || "/default-dish.jpeg"}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="rounded-full bg-white/95 px-3 py-1 text-sm font-semibold text-stone-800 shadow-sm">
                      ETB {item.price.toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <h4 className="font-display font-semibold text-stone-800 line-clamp-1">{item.name}</h4>
                  {item.restaurant && (
                    <Link
                      href={`/restaurants/${item.restaurant._id}`}
                      className="text-xs text-[var(--brand)] hover:underline"
                    >
                      {item.restaurant.name}
                    </Link>
                  )}
                  <MenuItemRating item={item} />
                  <Button
                    size="sm"
                    className="mt-2 w-full rounded-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] transition-all duration-300 hover:scale-[1.02] active:scale-100"
                    onClick={() => {
                      if (isAuthenticated()) {
                        dispatch(add({ item, restaurantId: item.restaurant._id }));
                      } else {
                        toast.warning("Please sign in to add items to your cart");
                      }
                    }}
                  >
                    Add to order
                  </Button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <Toaster />
    </>
  );
}
