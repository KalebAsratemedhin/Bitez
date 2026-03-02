"use client";

import { CheckCircle2, Circle } from "lucide-react";
import type { DeliveryStatus } from "@/types/delivery";

export type OrderStatusDisplay = "pending" | "preparing" | "ready" | "cancelled";

const ORDER_STEPS: { key: OrderStatusDisplay; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
];

function getOrderStepIndex(status: string, paymentCompleted?: boolean): number {
  const normalized =
    status === "unpaid" && paymentCompleted ? "pending" : (status as OrderStatusDisplay);
  if (normalized === "cancelled") return -1;
  const idx = ORDER_STEPS.findIndex((s) => s.key === normalized);
  return idx >= 0 ? idx : 0;
}

export function OrderStatusStepper({
  status,
  paymentCompleted,
}: {
  status: string;
  paymentCompleted?: boolean;
}) {
  const currentIndex = getOrderStepIndex(status, paymentCompleted);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
        <span className="text-red-600 font-medium text-sm">Order cancelled</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-1 py-2">
      {ORDER_STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isDone
                    ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                    : isCurrent
                    ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                    : "border-stone-200 bg-stone-50 text-stone-400"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className={isCurrent ? "h-4 w-4 fill-[var(--brand)]/20" : "h-3 w-3"} />
                )}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium text-center leading-tight max-w-16 ${
                  isDone ? "text-stone-600" : isCurrent ? "text-stone-800" : "text-stone-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < ORDER_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 min-w-2 mx-0.5 rounded ${
                  i < currentIndex ? "bg-[var(--brand)]" : "bg-stone-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const DELIVERY_STEPS: { key: DeliveryStatus; label: string }[] = [
  { key: "assigned", label: "Assigned" },
  { key: "picked_up", label: "Picked up" },
  { key: "delivered", label: "Delivered" },
];

function getDeliveryStepIndex(status: DeliveryStatus): number {
  if (status === "failed") return -1;
  if (status === "on_the_way") return 1;
  const idx = DELIVERY_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export function DeliveryStatusStepper({ status }: { status: DeliveryStatus }) {
  const currentIndex = getDeliveryStepIndex(status);
  const isFailed = status === "failed";

  if (isFailed) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
        <span className="text-red-600 font-medium text-sm">Delivery failed</span>
      </div>
    );
  }

  const displayIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="flex items-center justify-between gap-1 py-2">
      {DELIVERY_STEPS.map((step, i) => {
        const isDone = i < displayIndex;
        const isCurrent = i === displayIndex;
        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isDone
                    ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                    : isCurrent
                    ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                    : "border-stone-200 bg-stone-50 text-stone-400"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className={isCurrent ? "h-4 w-4 fill-[var(--brand)]/20" : "h-3 w-3"} />
                )}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium text-center leading-tight max-w-16 ${
                  isDone ? "text-stone-600" : isCurrent ? "text-stone-800" : "text-stone-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < DELIVERY_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 min-w-2 mx-0.5 rounded ${
                  i < displayIndex ? "bg-[var(--brand)]" : "bg-stone-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
