"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
};

export function NavLink({
  href,
  children,
  className,
  activeClassName = "text-[var(--brand)] font-semibold",
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "transition-colors font-medium px-3 py-2 rounded-lg",
        isActive ? activeClassName : "text-stone-600 hover:text-[var(--brand)]",
        className
      )}
    >
      {children}
    </Link>
  );
}
