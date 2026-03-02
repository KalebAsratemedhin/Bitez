"use client";

import { ProtectedRoute } from "@/components/layout";
import { DashboardLayout } from "@/components/layout";


export default function DashboardLayoutRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
