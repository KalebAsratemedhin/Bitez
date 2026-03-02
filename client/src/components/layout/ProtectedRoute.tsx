"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("token") && !!localStorage.getItem("user");
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/signin");
    }
  }, [router, pathname]);

  if (typeof window === "undefined") return null;
  if (!isAuthenticated()) return null;

  return <>{children}</>;
}
