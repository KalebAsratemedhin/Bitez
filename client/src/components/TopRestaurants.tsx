"use client";

import { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { useGetTopRestaurantsQuery } from "@/redux/api/ratingApi";
import { getImageUrl } from "@/lib/utils";


type RestaurantItem = {
  _id: string;
  name: string;
  logo?: string | null;
  location?: { address?: string } | string | null;
  rating?: number;
};

function RestaurantLogo({
  restaurant,
  dark,
  onError,
}: {
  restaurant: RestaurantItem;
  dark?: boolean;
  onError: () => void;
}) {
  const src = restaurant.logo ? getImageUrl(restaurant.logo) : null;

  if (src) {
    return (
      <img
        src={src}
        alt={`${restaurant.name} logo`}
        className="w-full h-full object-cover rounded-2xl"
        onError={onError}
      />
    );
  }
  return (
    <div
      className={`w-full h-full rounded-2xl flex items-center justify-center ${dark ? "bg-stone-700" : "bg-stone-100"}`}
      aria-hidden
    >
      <span className={`text-3xl font-display font-bold ${dark ? "text-stone-500" : "text-stone-400"}`}>
        {restaurant.name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}


function getAddress(location: RestaurantItem["location"]): string {
  if (!location) return "";
  if (typeof location === "string") return location;
  return location.address ?? "";
}


type TopRestaurantsProps = { variant?: "light" | "dark" };

export default function TopRestaurants({ variant = "light" }: TopRestaurantsProps) {
  const { data, isLoading, error } = useGetTopRestaurantsQuery();
  const isDark = variant === "dark";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        Failed to load top restaurants.
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className={`text-center py-12 ${isDark ? "text-stone-500" : "text-stone-500"}`}>
        No restaurants to show yet.
      </div>
    );
  }

  const navClass = isDark
    ? "border-0 bg-stone-800/90 text-white shadow-lg hover:bg-stone-700 transition-all duration-300 hover:scale-105"
    : "border-0 bg-white/95 shadow-md hover:bg-white transition-all duration-300 hover:scale-105";

  return (
    <Carousel opts={{ align: "start", loop: true }} className="w-full">
      <CarouselPrevious className={`left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 ${navClass}`} />
      <CarouselNext className={`right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 ${navClass}`} />
      <CarouselContent className="-ml-3 md:-ml-4">
        {(data as RestaurantItem[]).map((restaurant, index) => (
          <CarouselItem
            key={restaurant._id}
            className="pl-3 md:pl-4 basis-[200px] sm:basis-[240px] md:basis-[260px]"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <Link
              href={`/restaurants/${restaurant._id}`}
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-2xl transition-all duration-300 hover:scale-[1.02]"
            >
              <RestaurantCard restaurant={restaurant} isDark={isDark} />
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}


function RestaurantCard({ restaurant, isDark }: { restaurant: RestaurantItem; isDark: boolean }) {
  const [logoError, setLogoError] = useState(false);
  const showFallbackLogo = !restaurant.logo || logoError;
  const address = getAddress(restaurant.location);

  return (
    <div className="flex flex-col items-center text-center p-4 rounded-2xl transition-all duration-300 group-hover:bg-white/5 group-hover:shadow-xl">
      <div
        className={`relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden ring-1 transition-all duration-300 group-hover:scale-105 group-hover:ring-2 ${
          isDark
            ? "bg-stone-800 ring-stone-600 group-hover:ring-[var(--brand)]/50"
            : "bg-stone-100 ring-stone-200/60 group-hover:ring-[var(--brand)]/40"
        }`}
      >
        {!showFallbackLogo ? (
          <RestaurantLogo
            restaurant={{ ...restaurant, logo: restaurant.logo }}
            dark={isDark}
            onError={() => setLogoError(true)}
          />
        ) : (
          <RestaurantLogo
            restaurant={{ ...restaurant, logo: null }}
            dark={isDark}
            onError={() => {}}
          />
        )}
      </div>
      <h3
        className={`mt-4 font-display font-semibold line-clamp-2 transition-colors ${
          isDark ? "text-white group-hover:text-[var(--brand)]" : "text-stone-800 group-hover:text-[var(--brand)]"
        }`}
      >
        {restaurant.name}
      </h3>
      {address && (
        <p className={`mt-2 text-xs flex items-center justify-center gap-1 max-w-full truncate ${isDark ? "text-stone-400" : "text-stone-500"}`}>
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{address}</span>
        </p>
      )}
      <div className="flex items-center justify-center gap-1 mt-2">
        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
        <span className={`text-sm font-medium ${isDark ? "text-stone-400" : "text-stone-600"}`}>
          {restaurant.rating != null ? Number(restaurant.rating).toFixed(1) : "—"}
        </span>
      </div>
      <span className="mt-3 text-xs text-[var(--brand)] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        View & order →
      </span>
    </div>
  );
}
