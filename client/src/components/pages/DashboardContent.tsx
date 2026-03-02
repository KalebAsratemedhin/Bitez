"use client";

import { useGetCurrentUserQuery } from "@/redux/api/authApi";
import AdminDashboard from "@/components/AdminDashboard";
import CustomerDashboard from "@/components/CustomerDashboard";
import DeliveryPersonDashboard from "@/components/DeliveryPersonDashboard";
import RestaurantOwnerDashboard from "@/components/RestaurantOwnerDashboard";
import { Loader2 } from "lucide-react";


export function DashboardContent() {
  const { data: user } = useGetCurrentUserQuery();

  if (user?.role === "customer") return <CustomerDashboard />;
  if (user?.role === "restaurant_owner") return <RestaurantOwnerDashboard />;
  if (user?.role === "delivery_person") return <DeliveryPersonDashboard />;
  if (user?.role === "admin") return <AdminDashboard />;

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-10 w-10 animate-spin text-[var(--brand)]" />
      <p className="mt-4 text-stone-600 font-medium">Loading your dashboard...</p>
    </div>
  );
}
