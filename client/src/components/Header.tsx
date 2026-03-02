"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLink } from "@/components/layout";
import { isAuthenticated } from "@/utils/auth";
import CurrentUser from "./CurrentUser";
import Cart from "./Cart";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";
import { FC } from "react";


const HEADER_HEIGHT = "4rem";

const PATH_TITLES: Record<string, string> = {
  "/": "Home",
  "/dashboard": "Dashboard",
  "/settings": "Settings",
  "/restaurants": "Restaurants",
  "/orders": "My Orders",
  "/restaurant-management": "My Restaurant",
  "/restaurant-orders": "Restaurant Orders",
  "/deliveries/delivery-person": "My Deliveries",
  "/deliveries/customer": "Track Deliveries",
  "/user-management": "Manage Users",
  "/restaurant-applications": "Restaurant Applications",
};

function getPageTitle(pathname: string): string {
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname];
  if (pathname.startsWith("/restaurants/")) return "Restaurant";
  return "Dashboard";
}

export const AuthHeader: FC = () => {
  const { state } = useSidebar();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname ?? "");
  return (
    <header
      className={`fixed top-0 right-0 z-50 flex h-16 items-center justify-between border-b border-stone-200/80 px-6 py-4 transition-[left] duration-200 ease-linear ${
        state === "expanded" ? "left-0 md:left-[16rem]" : "left-0"
      }`}
      style={{ backgroundColor: "var(--surface-warm)", height: HEADER_HEIGHT }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="md:hidden shrink-0">
          <SidebarTrigger />
        </div>
        <span className="font-display text-lg font-semibold text-stone-800 truncate" aria-hidden="true">
          {pageTitle}
        </span>
      </div>

      <nav className="hidden md:flex gap-1 flex-1 justify-center">
        <NavLink href="/">Home</NavLink>
        <NavLink href="/about">About</NavLink>
        <NavLink href="/restaurants">Restaurants</NavLink>
      </nav>

      {isAuthenticated() ? (
        <div className="flex items-center gap-3">
          <Cart />
          <CurrentUser />
        </div>
      ) : (
        <div className="flex gap-2">
          <Link
            href="/signup"
            className="rounded-full border-2 border-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand)]/5 transition"
          >
            Sign up
          </Link>
          <Link
            href="/signin"
            className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] transition"
          >
            Sign in
          </Link>
        </div>
      )}
    </header>
  );
};


export const BasicHeader: FC = () => {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-stone-200/80 px-6 py-4"
      style={{ backgroundColor: "var(--surface-warm)", height: HEADER_HEIGHT }}
    >
      <Link
        href="/"
        className="flex items-center gap-2.5 font-display text-2xl font-bold text-stone-800"
      >
        <img src="/bitez-logo.svg" alt="" className="h-8 w-8 shrink-0" />
        Bitez
      </Link>

      <nav className="hidden md:flex gap-1">
        <NavLink href="/">Home</NavLink>
        <NavLink href="/about">About</NavLink>
        <NavLink href="/restaurants">Restaurants</NavLink>
      </nav>

      {isAuthenticated() ? (
        <div className="flex items-center gap-3">
          <Cart />
          <CurrentUser />
        </div>
      ) : (
        <div className="flex gap-2">
          <Link
            href="/signup"
            className="rounded-full border-2 border-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand)]/5 transition"
          >
            Sign up
          </Link>
          <Link
            href="/signin"
            className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] transition"
          >
            Sign in
          </Link>
        </div>
      )}
    </header>
  );
};
