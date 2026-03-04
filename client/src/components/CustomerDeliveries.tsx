"use client";

import { useState } from "react";
import { useGetCustomerDeliveriesQuery } from "@/redux/api/deliveryApi";
import { useRateEntityMutation } from "@/redux/api/ratingApi";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import LeafletMap from "@/components/LeafletMap";
import Link from "next/link";
import {
  Star,
  Loader2,
  UserRound,
  Clock,
  MapPin,
  ChevronRight,
  Truck,
  UtensilsCrossed,
  Receipt,
} from "lucide-react";
import type { DeliveryStatus } from "@/types/delivery";
import { DeliveryStatusStepper } from "@/components/StatusSteppers";

const DeliveryPersonRating = ({
  deliveryPersonId,
  currentRating,
}: {
  deliveryPersonId: string;
  currentRating: number;
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [rateEntity] = useRateEntityMutation();

  const handleRate = async (value: number) => {
    try {
      await rateEntity({
        entityType: "Delivery_Person",
        entityId: deliveryPersonId,
        rating: value,
      }).unwrap();
      toast.success(`Rated delivery person ${value} stars!`);
    } catch {
      toast.error("Failed to rate delivery person.");
    }
  };

  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={14}
          className="cursor-pointer transition-transform hover:scale-110"
          fill={
            hovered != null
              ? value <= hovered
                ? "currentColor"
                : "none"
              : value <= Math.round(currentRating)
              ? "currentColor"
              : "none"
          }
          stroke="currentColor"
          onMouseEnter={() => setHovered(value)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleRate(value)}
        />
      ))}
      <span className="ml-1 text-xs text-stone-500">({currentRating?.toFixed(1) || 0})</span>
    </div>
  );
};

function formatDeliveryTime(iso?: string | Date): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

const CustomerDeliveries = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetCustomerDeliveriesQuery({
    page,
    limit: 6,
  });

  const rawDeliveries = data?.data || [];
  const deliveries = Array.isArray(rawDeliveries) ? rawDeliveries.filter(Boolean) : [];
  const limit = 6;
  const totalCount = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--brand)]" />
        <p className="mt-4 text-stone-500 font-medium">Loading your deliveries…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center max-w-md mx-auto">
        <p className="text-red-600 font-medium">Failed to load deliveries.</p>
        <p className="text-red-500 text-sm mt-1">Please try again later.</p>
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-12 text-center max-w-md mx-auto">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-stone-200/80 text-stone-500 mb-4">
          <Truck className="h-7 w-7" />
        </div>
        <h3 className="font-display text-lg font-semibold text-stone-800">No deliveries yet</h3>
        <p className="text-stone-500 text-sm mt-1">When you place orders, you’ll see them here.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
          See status and details for your orders on the way.
        </h1>
      </div>

      <div className="space-y-5">
        {deliveries.map((delivery, index) => {
          const orderId = delivery?.orderId;
          const restaurant =
            orderId && typeof orderId === "object" && "restaurantID" in orderId
              ? (orderId as { restaurantID?: { _id?: string; name?: string } }).restaurantID
              : undefined;
          const restaurantIdStr =
            restaurant != null && typeof restaurant === "object" && "_id" in restaurant
              ? String((restaurant as { _id?: string })._id ?? "")
              : typeof restaurant === "string"
                ? restaurant
                : "";
          const restaurantName =
            restaurant != null && typeof restaurant === "object" && "name" in restaurant
              ? String((restaurant as { name?: string }).name ?? "Restaurant")
              : "Restaurant";
          const deliveryPerson =
            delivery?.deliveryPersonId && typeof delivery.deliveryPersonId === "object" && "userId" in delivery.deliveryPersonId
              ? (delivery.deliveryPersonId as { userId?: { _id?: string; name?: string; profileImage?: string }; _id?: string; rating?: number }).userId
              : undefined;
          const dpId =
            delivery?.deliveryPersonId && typeof delivery.deliveryPersonId === "object" && "_id" in delivery.deliveryPersonId
              ? String((delivery.deliveryPersonId as { _id?: string })._id ?? "")
              : typeof delivery?.deliveryPersonId === "string"
                ? delivery.deliveryPersonId
                : "";

          return (
            <Card
              key={delivery?._id ?? `delivery-${index}`}
              className="overflow-hidden border border-stone-200/80 shadow-sm hover:shadow-md transition-shadow rounded-2xl"
            >
              <CardContent className="p-0">
                <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/30">
                  <DeliveryStatusStepper status={delivery?.status as DeliveryStatus} />
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]">
                        <UtensilsCrossed className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-stone-800 truncate">
                          {restaurantIdStr ? (
                            <Link
                              className="hover:text-[var(--brand)] transition-colors"
                              href={`/restaurants/${restaurantIdStr}`}
                            >
                              {restaurantName}
                            </Link>
                          ) : (
                            <span>{restaurantName}</span>
                          )}
                        </p>
                        <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3.5 w-3.5" />
                          ETA {formatDeliveryTime(delivery?.estimatedDeliveryTime)}
                        </p>
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="shrink-0 text-stone-600">
                          Details
                          <ChevronRight className="h-4 w-4 ml-0.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="font-display">Delivery details</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4">
                          <DeliveryStatusStepper status={delivery?.status as DeliveryStatus} />
                          {orderId && typeof orderId === "object" && "orderDetails" in orderId && Array.isArray((orderId as { orderDetails?: unknown[] }).orderDetails) && (orderId as { orderDetails: unknown[] }).orderDetails.length > 0 ? (
                            <div className="rounded-xl border border-stone-200 overflow-hidden">
                              <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-200 flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-[var(--brand)]" />
                                <span className="text-sm font-medium text-stone-700">Items</span>
                              </div>
                              <ul className="divide-y divide-stone-100">
                                {((orderId as { orderDetails: { item?: { _id?: string; name?: string; price?: number }; quantity?: number }[] }).orderDetails).map(
                                  (entry: { item?: { _id?: string; name?: string; price?: number }; quantity?: number }, i: number) => {
                                    const item = entry?.item;
                                    const quantity = entry?.quantity ?? 0;
                                    return (
                                    <li
                                      key={item?._id ?? i}
                                      className="flex justify-between items-center px-4 py-3 text-sm"
                                    >
                                      <span className="text-stone-800">
                                        {item?.name ?? "Item"} × <span className="font-medium">{quantity}</span>
                                      </span>
                                      <span className="text-stone-600">
                                        ETB {((item?.price ?? 0) * quantity).toFixed(2)}
                                      </span>
                                    </li>
                                    );
                                  }
                                )}
                              </ul>
                            </div>
                          ) : null}
                          {orderId && typeof orderId === "object" && "coordinates" in orderId && (orderId as { coordinates?: { lat?: number; lng?: number } }).coordinates && (
                            <div className="rounded-xl border border-stone-200 overflow-hidden">
                              <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-200 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-[var(--brand)]" />
                                <span className="text-sm font-medium text-stone-700">
                                  Delivery location
                                </span>
                              </div>
                              <LeafletMap
                                center={{
                                  lat: (orderId as { coordinates: { lat: number; lng: number } }).coordinates.lat,
                                  lng: (orderId as { coordinates: { lat: number; lng: number } }).coordinates.lng,
                                }}
                                zoom={15}
                                height={220}
                                className="w-full"
                                markerPosition={{
                                  lat: (orderId as { coordinates: { lat: number; lng: number } }).coordinates.lat,
                                  lng: (orderId as { coordinates: { lat: number; lng: number } }).coordinates.lng,
                                }}
                                popupText="Delivery address"
                              />
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-600 overflow-hidden">
                      {deliveryPerson?.profileImage ? (
                        <img
                          src={deliveryPerson.profileImage}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-800">
                        {deliveryPerson != null && typeof deliveryPerson === "object" && "name" in deliveryPerson
                          ? String((deliveryPerson as { name?: string }).name ?? "Driver not assigned")
                          : "Driver not assigned"}
                      </p>
                      {dpId && delivery?.status === "delivered" && (
                        <DeliveryPersonRating
                          deliveryPersonId={dpId}
                          currentRating={
                            delivery?.deliveryPersonId && typeof delivery.deliveryPersonId === "object" && "rating" in delivery.deliveryPersonId
                              ? Number((delivery.deliveryPersonId as { rating?: number }).rating ?? 0)
                              : 0
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totalPages > 1 && (
        <Pagination className="justify-center pt-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            <PaginationItem className="px-4 text-sm text-stone-600">
              {page} / {totalPages}
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className={
                  page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Toaster />
    </div>
  );
};

export default CustomerDeliveries;
