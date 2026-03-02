"use client";

import { useState, useEffect } from "react";
import { useGetAllMineRestaurantQuery } from "@/redux/api/restaurantApi";
import {
  useGetRestaurantOrdersQuery,
  useUpdateOrderStatusMutation,
} from "@/redux/api/orderApi";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { formatDateTime, getImageUrl, cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Utensils,
  Loader2,
  ChefHat,
  Package,
  MapPin,
  ChevronDown,
  Receipt,
} from "lucide-react";
import { Order } from "@/types/order";
import { OrderStatusStepper } from "@/components/StatusSteppers";

const ORDERS_PER_PAGE = 10;

function RestaurantLogo({
  restaurant,
  className,
  size = 8,
}: {
  restaurant: { _id: string; name: string; logo?: string };
  className?: string;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const src = getImageUrl(restaurant.logo);
  const showImg = src && !imgError;
  const sizeClass = size === 8 ? "h-8 w-8" : "h-6 w-6";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-stone-100 text-stone-600 font-semibold",
        sizeClass,
        className
      )}
    >
      {showImg ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-xs">{restaurant.name.charAt(0).toUpperCase()}</span>
      )}
    </span>
  );
}

const getNextStatus = (current: string): "preparing" | "ready" | null => {
  switch (current) {
    case "pending":
      return "preparing";
    case "preparing":
      return "ready";
    default:
      return null;
  }
};

function statusConfig(status: string) {
  switch (status) {
    case "cancelled":
      return { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-200" };
    case "pending":
      return { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" };
    case "preparing":
      return { label: "Preparing", className: "bg-blue-100 text-blue-800 border-blue-200" };
    case "ready":
      return { label: "Ready", className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    default:
      return { label: status, className: "bg-stone-100 text-stone-700 border-stone-200" };
  }
}

function getCustomerName(order: Order): string {
  const c = order.customerID;
  if (!c) return "Customer";
  if (typeof c === "object" && c !== null && "name" in c) return (c as { name: string }).name;
  return "Customer";
}

function getOrderTotal(order: Order): number {
  if (order.totalAmount != null) return order.totalAmount;
  return order.orderDetails.reduce(
    (sum, { item, quantity }) => sum + item.price * quantity,
    0
  );
}

const RestaurantOrdersPage = () => {
  const [page, setPage] = useState(1);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const {
    data: restaurantsData,
    isLoading: isLoadingRestaurants,
    isError: isRestaurantError,
  } = useGetAllMineRestaurantQuery({ page: 1, limit: 100 });

  const restaurants = restaurantsData?.data || [];

  useEffect(() => {
    if (!isLoadingRestaurants && restaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(restaurants[0]._id);
    }
  }, [isLoadingRestaurants, restaurants, selectedRestaurantId]);

  const {
    data: ordersData,
    isLoading,
    isError,
  } = useGetRestaurantOrdersQuery(
    { restaurantId: selectedRestaurantId!, page, limit: ORDERS_PER_PAGE },
    { skip: !selectedRestaurantId }
  );

  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const orders = ordersData?.data || [];
  const pagination = ordersData?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalOrders = pagination?.total ?? 0;

  const handleStatusUpdate = async (
    orderId: string,
    currentStatus: "pending" | "preparing" | "ready" | "cancelled"
  ) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return;
    try {
      await updateStatus({ id: orderId, status: nextStatus }).unwrap();
      toast.success(`Order marked as ${nextStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (isRestaurantError) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="text-red-600 font-medium">Failed to load your restaurants.</p>
        <Toaster />
      </div>
    );
  }

  if (!isLoadingRestaurants && restaurants.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="rounded-2xl bg-stone-100 p-8 inline-flex mb-6">
          <Utensils className="h-14 w-14 text-stone-400" />
        </div>
        <h2 className="font-display text-2xl font-bold text-stone-800 mb-2">No restaurants yet</h2>
        <p className="text-stone-600 mb-2">You need a restaurant to receive orders.</p>
        <Toaster />
      </div>
    );
  }

  const selectedRestaurant = restaurants.find((r) => r._id === selectedRestaurantId);

  return (
    <div className="w-full min-w-0 px-0 py-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
          View and update orders. Select a restaurant to see its orders.
        </h1>
      </div>

      {/* Restaurant switcher */}
      <div className="mb-8">
        {restaurants.length <= 4 ? (
          <div className="flex flex-wrap gap-2">
            {restaurants.map((r) => (
              <button
                key={r._id}
                type="button"
                onClick={() => {
                  setSelectedRestaurantId(r._id);
                  setPage(1);
                }}
                className={cn(
                  "rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-colors flex items-center gap-3",
                  selectedRestaurantId === r._id
                    ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                )}
              >
                <RestaurantLogo restaurant={r} size={8} />
                {r.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-stone-600 mb-2">Restaurant</label>
            <Select
              value={selectedRestaurantId ?? ""}
              onValueChange={(value) => {
                setSelectedRestaurantId(value || null);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full rounded-xl border-2 border-stone-200 h-12 px-4 gap-3">
                <SelectValue placeholder="Select a restaurant">
                  {selectedRestaurantId && selectedRestaurant && (
                    <span className="flex items-center gap-3">
                      <RestaurantLogo restaurant={selectedRestaurant} size={6} />
                      {selectedRestaurant.name}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((r) => (
                  <SelectItem key={r._id} value={r._id} className="flex items-center gap-3 py-2.5">
                    <RestaurantLogo restaurant={r} size={6} />
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Orders for selected restaurant */}
      {selectedRestaurantId && (
        <>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-[var(--brand)]" />
              <p className="text-stone-500 text-sm">Loading orders…</p>
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/50 py-12 text-center">
              <p className="text-red-600 font-medium">Failed to load orders.</p>
              <Toaster />
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 py-16 text-center">
              <Package className="h-14 w-14 text-stone-300 mx-auto mb-4" />
              <p className="font-display font-semibold text-stone-700">No orders yet</p>
              <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
                Orders for {selectedRestaurant?.name ?? "this restaurant"} will appear here.
              </p>
              <Toaster />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-stone-600">
                  {totalOrders} order{totalOrders !== 1 ? "s" : ""}
                  {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
                </p>
              </div>

              <ul className="space-y-3">
                {orders.map((order) => {
                  const total = getOrderTotal(order);
                  const customerName = getCustomerName(order);
                  const status = statusConfig(order.status);
                  const nextStatus = getNextStatus(order.status);
                  const isExpanded = expandedOrderId === order._id;

                  return (
                    <li
                      key={order._id}
                      className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Summary row: always visible */}
                      <button
                        type="button"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                        className="w-full text-left p-4 sm:p-5 flex flex-wrap items-center gap-3 sm:gap-4"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Receipt className="h-5 w-5 text-stone-400 shrink-0" />
                          <span className="font-display font-semibold text-stone-900 truncate">
                            {customerName}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 capitalize",
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                        <span className="text-sm text-stone-500 shrink-0 tabular-nums">
                          {formatDateTime(order.createdAt)}
                        </span>
                        <span className="font-display font-semibold text-stone-900 shrink-0 ml-auto">
                          ETB {total.toFixed(2)}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-5 w-5 text-stone-400 shrink-0 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>

                      {/* Expandable detail */}
                      {isExpanded && (
                        <div className="border-t border-stone-100 bg-stone-50/50 px-4 sm:px-5 py-4 space-y-4">
                          <div className="rounded-xl border border-stone-200 bg-white p-3">
                            <OrderStatusStepper
                              status={order.status}
                              paymentCompleted={order.paymentCompleted}
                            />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              Delivery address
                            </p>
                            <p className="text-sm text-stone-700">{order.deliveryAddress}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                              Items
                            </p>
                            <ul className="rounded-xl bg-white border border-stone-100 p-3 space-y-2">
                              {order.orderDetails.map(({ item, quantity }) => (
                                <li
                                  key={item._id}
                                  className="flex justify-between items-center text-sm"
                                >
                                  <span className="text-stone-800">
                                    {item.name} × <span className="font-semibold">{quantity}</span>
                                  </span>
                                  <span className="font-medium text-stone-700 tabular-nums">
                                    ETB {(item.price * quantity).toFixed(2)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            {nextStatus && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(order._id, order.status);
                                }}
                                disabled={isUpdating}
                                className="rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold gap-2"
                              >
                                {nextStatus === "preparing" ? (
                                  <>
                                    <ChefHat className="h-4 w-4" />
                                    Start preparing
                                  </>
                                ) : (
                                  <>
                                    <Package className="h-4 w-4" />
                                    Mark ready for delivery
                                  </>
                                )}
                              </Button>
                            )}
                            {order.status === "ready" && (
                              <p className="text-sm text-emerald-700 flex items-center gap-2 font-medium">
                                <Package className="h-4 w-4" />
                                Ready for delivery
                              </p>
                            )}
                            {order.status === "cancelled" && (
                              <p className="text-sm text-stone-500">Order cancelled</p>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <div className="flex justify-center pt-8">
                  <Pagination>
                    <PaginationContent className="gap-2">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={
                            page === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer rounded-full"
                          }
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="text-sm text-stone-600 px-4 py-2">
                          Page {page} of {totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          className={
                            page === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer rounded-full"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </>
      )}
      <Toaster />
    </div>
  );
};

export default RestaurantOrdersPage;
