"use client";

import { useState } from "react";
import {
  useGetDeliveryPersonDeliveriesQuery,
  useUpdateDeliveryStatusMutation,
} from "@/redux/api/deliveryApi";
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
import { toast, Toaster } from "sonner";
import { DeliveryStatus } from "@/types/delivery";
import Link from "next/link";
import {
  Loader2,
  Truck,
  UtensilsCrossed,
  UserRound,
  Phone,
  Clock,
  ChevronRight,
  MapPin,
  Receipt,
  Package,
  XCircle,
} from "lucide-react";
import DeliveryDetailsPage from "@/components/pages/DeliveryDetails";
import { DeliveryStatusStepper } from "@/components/StatusSteppers";

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

const DeliveryPersonDeliveries = () => {
  const [page, setPage] = useState(1);
  const limit = 6;
  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateDeliveryStatusMutation();
  const { data, isLoading, isError } = useGetDeliveryPersonDeliveriesQuery({
    page,
    limit,
  });

  const rawDeliveries = data?.data || [];
  const deliveries = Array.isArray(rawDeliveries) ? rawDeliveries.filter(Boolean) : [];
  const totalCount = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const deliveryPerson = data?.deliveryPerson;

  const handleStatusUpdate = async (
    deliveryId: string,
    status: DeliveryStatus
  ) => {
    try {
      const res = await updateStatus({ id: deliveryId, status }).unwrap();
      if (res.success) toast.success(`Status updated`);
    } catch {
      toast.error("Failed to update delivery status");
    }
  };

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
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-12 text-center max-w-md mx-auto">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-stone-200/80 text-stone-500 mb-4">
          <Truck className="h-7 w-7" />
        </div>
        <h3 className="font-display text-lg font-semibold text-stone-800">No assigned deliveries</h3>
        <p className="text-stone-500 text-sm mt-1">New orders will appear here when assigned.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
          Update status and view delivery details.
        </h1>
        {deliveryPerson && (
          <p className="mt-2 text-stone-600 flex items-center gap-2 flex-wrap">
            <UserRound className="h-4 w-4 text-stone-500" />
            <span className="font-medium text-stone-800">{deliveryPerson.name}</span>
            {deliveryPerson.phoneNumber && (
              <>
                <span className="text-stone-400">·</span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {deliveryPerson.phoneNumber}
                </span>
              </>
            )}
          </p>
        )}
      </div>

      <div className="space-y-5">
        {deliveries.map((delivery, index) => {
          const orderId = delivery?.orderId;
          const restaurantId = orderId && typeof orderId === "object" && "restaurantID" in orderId
            ? (orderId as { restaurantID?: { _id?: string; name?: string } }).restaurantID
            : undefined;
          const restaurantIdStr =
            restaurantId != null && typeof restaurantId === "object" && "_id" in restaurantId
              ? String((restaurantId as { _id?: string })._id)
              : typeof restaurantId === "string"
                ? restaurantId
                : "";
          const restaurantName =
            restaurantId != null && typeof restaurantId === "object" && "name" in restaurantId
              ? String((restaurantId as { name?: string }).name ?? "Restaurant")
              : "Restaurant";
          const customerId = orderId && typeof orderId === "object" && "customerID" in orderId
            ? (orderId as { customerID?: { name?: string; phoneNumber?: string } }).customerID
            : undefined;
          const customerName =
            customerId != null && typeof customerId === "object" && "name" in customerId
              ? String((customerId as { name?: string }).name ?? "—")
              : "—";
          const customerPhone =
            customerId != null && typeof customerId === "object" && "phoneNumber" in customerId
              ? String((customerId as { phoneNumber?: string }).phoneNumber ?? "—")
              : "—";
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
                      <p className="font-display font-semibold text-stone-800">
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
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5" suppressHydrationWarning>
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
                        {orderId && typeof orderId === "object" && "orderDetails" in orderId && Array.isArray((orderId as { orderDetails?: unknown[] }).orderDetails) && (orderId as { orderDetails: unknown[] }).orderDetails.length ? (
                          <div className="rounded-xl border border-stone-200 overflow-hidden">
                            <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-200 flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-[var(--brand)]" />
                              <span className="text-sm font-medium text-stone-700">Items</span>
                            </div>
                            <ul className="divide-y divide-stone-100">
                              {((orderId as { orderDetails: { item?: { _id?: string; name?: string; price?: number }; quantity?: number }[] }).orderDetails).map(
                                (
                                  entry: { item?: { _id?: string; name?: string; price?: number }; quantity?: number },
                                  i: number
                                ) => {
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
                        {orderId && typeof orderId === "object" && "coordinates" in orderId && (orderId as { coordinates?: unknown }).coordinates ? (
                          <div className="rounded-xl border border-stone-200 overflow-hidden">
                            <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-200 flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-[var(--brand)]" />
                              <span className="text-sm font-medium text-stone-700">
                                Delivery location
                              </span>
                            </div>
                            <div className="h-[280px] w-full">
                              <DeliveryDetailsPage delivery={delivery} />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-600">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-800">
                      {customerName}
                    </p>
                    <p className="text-xs text-stone-500 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {customerPhone}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {delivery?.status === "assigned" && (
                    <Button
                      onClick={() => handleStatusUpdate(String(delivery?._id), "picked_up")}
                      disabled={isUpdating}
                      className="rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] gap-2"
                    >
                      <Package className="h-4 w-4" />
                      Mark picked up
                    </Button>
                  )}
                  {(delivery?.status === "picked_up" || delivery?.status === "on_the_way") && (
                    <>
                      <Button
                        onClick={() => handleStatusUpdate(String(delivery?._id), "delivered")}
                        disabled={isUpdating}
                        className="rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] gap-2"
                      >
                        Mark delivered
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusUpdate(String(delivery?._id), "failed")}
                        disabled={isUpdating}
                        className="rounded-xl gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Mark failed
                      </Button>
                    </>
                  )}
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

export default DeliveryPersonDeliveries;
