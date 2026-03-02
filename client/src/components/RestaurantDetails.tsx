"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useGetRestaurantByIdQuery } from "@/redux/api/restaurantApi";
import { useGetCurrentUserQuery } from "@/redux/api/authApi";
import {
  useRateEntityMutation,
  useGetRatingForEntityQuery,
} from "@/redux/api/ratingApi";
import { Loader2, Star, Pencil, MapPin, Navigation } from "lucide-react";
import { PartialStars } from "@/components/ui/partial-stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PopulatedRestaurant } from "@/types/restaurant";
import { getImageUrl } from "@/lib/utils";
import MenusCarousel from "./MenusCarousel";
import LeafletMap from "@/components/LeafletMap";
import { isAuthenticated } from "@/utils/auth";

function RestaurantHeader({ restaurant }: { restaurant: PopulatedRestaurant }) {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data } = useGetRatingForEntityQuery({
    entityType: "Restaurant",
    entityId: restaurant._id,
  });

  const [rateEntity] = useRateEntityMutation();

  const handleRate = async (rating: number) => {
    setSubmitting(true);
    try {
      await rateEntity({
        entityType: "Restaurant",
        entityId: restaurant._id,
        rating,
      }).unwrap();
      setUserRating(rating);
      toast.success("Thanks for your rating!");
    } catch (err: any) {
      const msg = err?.data?.message || err?.data?.error || "Rating submission failed.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating ?? userRating ?? data?.rating ?? 0;

  return (
    <header className="relative">
      <div className="relative min-h-[320px] md:min-h-[380px] flex items-end">
        <div className="absolute inset-0 bg-stone-900">
          {restaurant.logo ? (
            <img
              src={getImageUrl(restaurant.logo)}
              alt=""
              className="h-full w-full object-cover opacity-70"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-stone-700 to-stone-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        <div className="relative w-full max-w-6xl mx-auto px-6 pb-10 pt-24">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="shrink-0">
              {restaurant.logo ? (
                <img
                  src={getImageUrl(restaurant.logo)}
                  alt=""
                  className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-white/60 text-sm">
                  No logo
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-display text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                  {restaurant.name}
                </h1>
                <Badge className="bg-white/20 text-white border-0 capitalize hover:bg-white/30">
                  {restaurant.status}
                </Badge>
              </div>
              {restaurant.location?.address && (
                <p className="flex items-center gap-1.5 text-white/90 text-sm md:text-base mb-3">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {restaurant.location.address}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <PartialStars rating={restaurant.rating} size={20} className="text-amber-400" />
                  <span className="ml-1.5 text-white/90 text-sm font-medium">
                    {restaurant.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 -mt-4 relative z-10">
        <div className="rounded-2xl border border-stone-200 bg-white shadow-lg p-6">
          {isAuthenticated() ? (
            <>
              <p className="text-sm font-medium text-stone-700 mb-3">Your rating</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleRate(index)}
                      onMouseEnter={() => setHoverRating(index)}
                      onMouseLeave={() => setHoverRating(null)}
                      disabled={submitting}
                      className="p-1 rounded hover:bg-amber-50 transition-colors disabled:opacity-50"
                      aria-label={`Rate ${index} star${index > 1 ? "s" : ""}`}
                    >
                      <Star
                        size={28}
                        className="text-amber-500 transition-colors"
                        fill={index <= displayRating ? "currentColor" : "none"}
                        stroke="currentColor"
                      />
                    </button>
                  ))}
                </div>
                {submitting && (
                  <span className="text-sm text-stone-500">Submitting…</span>
                )}
              </div>
            </>
          ) : (
            <p className="text-stone-600 text-sm">
              Sign in to rate this restaurant.
            </p>
          )}
        </div>
      </div>
    </header>
  );
}

const RestaurantDetails = () => {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const { data, isLoading, error } = useGetRestaurantByIdQuery(id!);
  const { data: currentUser } = useGetCurrentUserQuery(undefined, { skip: !isAuthenticated() });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[40vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-(--brand)" />
        <p className="text-stone-500 text-sm">Loading restaurant…</p>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-red-600 font-medium">Failed to load restaurant details.</p>
        <p className="text-stone-500 text-sm mt-1">The restaurant may not exist or is unavailable.</p>
      </div>
    );
  }

  const restaurant = data.data;
  const coords = typeof restaurant.location === "object" && restaurant.location?.coordinates;
  const lat = Array.isArray(coords) && coords.length >= 2 ? coords[1] : 9.03;
  const lng = Array.isArray(coords) && coords.length >= 2 ? coords[0] : 38.74;

  const ownerId =
    restaurant.ownerId &&
    (typeof restaurant.ownerId === "object" && restaurant.ownerId !== null && "_id" in restaurant.ownerId
      ? (restaurant.ownerId as { _id: string })._id
      : restaurant.ownerId);

  const isOwner =
    isAuthenticated() &&
    currentUser &&
    String(ownerId) === String((currentUser as { _id?: string; id?: string })._id ?? (currentUser as { id?: string }).id);

  return (
    <div className="w-full min-w-0">
      {/* Owner actions */}
      {isOwner && (
        <section className="w-full py-6">
          <div className="max-w-6xl mx-auto px-6">
            <Button variant="outline" size="sm" asChild className="rounded-full border-stone-200">
              <Link href={`/restaurants/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit restaurant
              </Link>
            </Button>
          </div>
        </section>
      )}

      <RestaurantHeader restaurant={restaurant} />

      {/* Map + delivery info */}
      <section className="w-full py-12">
        <div className="px-12">
          <div className="flex flex-col xl:flex-row gap-8 xl:gap-12 items-stretch">
            <div className="xl:flex-1 space-y-4">
              <h2 className="font-display text-2xl font-bold text-stone-800 flex items-center gap-2">
                <Navigation className="h-6 w-6 text-[var(--brand)]" />
                Location & delivery
              </h2>
              <p className="text-stone-600">
                Delivery radius: <strong>{restaurant.deliveryAreaRadius} m</strong>. Check the map to see if we can reach you.
              </p>
            </div>
            <div className="h-[400px] xl:h-[380px] xl:min-w-[480px] xl:w-1/2 rounded-2xl overflow-hidden bg-stone-100 leaflet-map-root">
              <LeafletMap
                center={{ lat, lng }}
                zoom={15}
                height="100%"
                className="h-full w-full rounded-2xl overflow-hidden shadow-lg border border-stone-200"
                markerPosition={{ lat, lng }}
                popupText={restaurant.name}
                circleCenter={{ lat, lng }}
                circleRadius={restaurant.deliveryAreaRadius}
                circleUseBrandColor={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Menu */}
      <section className="w-full py-14" style={{ backgroundColor: "var(--surface-cream)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-stone-800 mb-2">Menu</h2>
          <p className="text-stone-600 mb-10">Browse dishes and add items to your order.</p>
          <MenusCarousel restaurantId={id!} />
        </div>
      </section>
    </div>
  );
};

export default RestaurantDetails;
