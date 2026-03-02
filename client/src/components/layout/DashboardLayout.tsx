"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { AuthHeader } from "@/components/Header";


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col min-h-screen w-full"
      style={{ backgroundColor: "var(--surface-warm)" }}
    >
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 w-full flex flex-col min-h-0 overflow-x-hidden">
          <AuthHeader />
          <div className="flex-1 w-full overflow-auto pt-16">
            <div className="w-full min-w-0 pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 py-4">
              {children}
            </div>
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
