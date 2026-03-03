"use client";
import { useState } from "react";
import {
  useGetCustomerOrdersQuery,
  useCancelOrderMutation,
} from "@/redux/api/orderApi";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { toast, Toaster } from "sonner";
import LeafletMap from "@/components/LeafletMap";
import { MapPin, Utensils, ChevronDown, ChevronRight, XCircle, Clock, Receipt } from "lucide-react";
import type { Order } from "@/types/order";
import { OrderStatusStepper } from "@/components/StatusSteppers";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const;

function displayStatus(order: Order): string {
  if (order.status === "unpaid" && order.paymentCompleted) return "pending";
  return order.status;
}

function formatOrderTime(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function OrderDetailsContent({ order }: { order: Order }) {
  const total =
    order.totalAmount ??
    order.orderDetails.reduce(
      (sum, { item, quantity }) => sum + item.price * quantity,
      0
    );
  const restaurantName =
    typeof order.restaurantID === "object" && order.restaurantID !== null && "name" in order.restaurantID
      ? (order.restaurantID as { name: string }).name
      : "Restaurant";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-stone-200 bg-stone-50/30 p-4 pb-3">
        <OrderStatusStepper
          status={order.status}
          paymentCompleted={order.paymentCompleted}
        />
      </div>
      <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-lg font-semibold text-stone-800">{restaurantName}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Clock className="h-4 w-4 shrink-0" />
          <span>{formatOrderTime(order.createdAt)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-stone-200">
          <span className="text-stone-600 text-sm">Total</span>
          <span className="font-display text-xl font-bold text-stone-800">
            ETB {total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Delivery address */}
      <div className="rounded-xl border border-stone-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[var(--brand)]" />
          Delivery address
        </p>
        <p className="text-stone-800">{order.deliveryAddress}</p>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-stone-200 overflow-hidden">
        <div className="bg-stone-50 px-4 py-3 border-b border-stone-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[var(--brand)]" />
            Items ({order.orderDetails.length})
          </p>
        </div>
        <ul className="divide-y divide-stone-100">
          {order.orderDetails.map(({ item, quantity }) => (
            <li
              key={item._id}
              className="flex justify-between items-center px-4 py-3 text-sm"
            >
              <span className="text-stone-800">
                {item.name} × <span className="font-medium">{quantity}</span>
              </span>
              <span className="font-semibold text-stone-800 tabular-nums">
                ETB {(item.price * quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Map */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
          Delivery location
        </p>
        <div className="rounded-xl overflow-hidden border border-stone-200 h-52">
          <LeafletMap
            center={{
              lat: order.coordinates.lat,
              lng: order.coordinates.lng,
            }}
            zoom={15}
            height={208}
            className="h-full w-full rounded-xl"
            markerPosition={{
              lat: order.coordinates.lat,
              lng: order.coordinates.lng,
            }}
            popupText="Delivery location"
          />
        </div>
      </div>
    </div>
  );
}

const OrdersPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const { data, isLoading, isError } = useGetCustomerOrdersQuery({
    page,
    limit,
  });
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

  const handleCancel = async (orderId: string) => {
    try {
      const res = await cancelOrder(orderId).unwrap();
      if (res.success) {
        toast.success("Order cancelled.");
        setExpandedOrderId(null);
      }
    } catch {
      toast.error("Failed to cancel order.");
    }
  };

  const orders = data?.data || [];
  const pagination = data?.pagination;
  const totalPages =
    pagination?.totalPages ??
    Math.max(1, Math.ceil((pagination?.total ?? 0) / limit));

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <p className="text-stone-500">Loading your orders…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-600 font-medium">Failed to load orders.</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="rounded-full bg-stone-100 p-6 inline-flex mb-4">
          <Utensils className="h-12 w-12 text-stone-400" />
        </div>
        <h2 className="font-display text-2xl font-bold text-stone-800 mb-2">No orders yet</h2>
        <p className="text-stone-600 mb-6">Your order history will appear here.</p>
        <Button asChild className="rounded-full bg-[var(--brand)] hover:bg-[var(--brand-hover)]">
          <a href="/restaurants">Browse restaurants</a>
        </Button>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <div className="flex-1 space-y-4">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-800 tracking-tight mb-6">View and manage your orders.</h1>

      <div className="space-y-2">
        {orders.map((order) => {
          const total =
            order.totalAmount ??
            order.orderDetails.reduce(
              (sum, { item, quantity }) => sum + item.price * quantity,
              0
            );
          const restaurantName =
            typeof order.restaurantID === "object" &&
            order.restaurantID !== null &&
            "name" in order.restaurantID
              ? (order.restaurantID as { name: string }).name
              : "Restaurant";
          const isExpanded = expandedOrderId === order._id;

          return (
            <Card
              key={order._id}
              className="border-stone-200 overflow-hidden transition-shadow"
            >
              <button
                type="button"
                onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                className="w-full text-left px-4 sm:px-5 py-3 flex flex-wrap items-center gap-2 sm:gap-4"
              >
                <span className="font-display font-semibold text-stone-800 truncate min-w-0">
                  {restaurantName}
                </span>
                <span className="text-xs text-stone-500 shrink-0 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatOrderTime(order.createdAt)}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${
                    displayStatus(order) === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : displayStatus(order) === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : displayStatus(order) === "ready"
                      ? "bg-green-100 text-green-800"
                      : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {displayStatus(order)}
                </span>
                <span className="font-display font-semibold text-stone-800 shrink-0 ml-auto tabular-nums">
                  ETB {total.toFixed(2)}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-stone-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-stone-100 bg-stone-50/30 px-4 sm:px-5 py-4 space-y-4">
                  <OrderDetailsContent order={order} />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {displayStatus(order) === "pending" && (
                      <Button
                        variant="outline"
                        className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                        disabled={isCancelling}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(order._id);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel order
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        limit={limit}
        limitOptions={PAGE_SIZE_OPTIONS}
        onLimitChange={(v) => {
          setLimit(v);
          setPage(1);
        }}
        className="flex-row"
      />

      <Toaster />
    </div>
  );
};

export default OrdersPage;
