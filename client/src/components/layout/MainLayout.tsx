"use client";

import { BasicHeader } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: "var(--surface-warm)" }}
    >
      <BasicHeader />
      <main
        className="flex-1 w-full min-h-0 pt-16"
        style={{ backgroundColor: "var(--surface-warm)" }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
