import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const apiBase = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ?? "";


/** Use for img src when the API returns a path like /uploads/restaurants/... or /uploads/menus/... (restaurant service). */
export function getImageUrl(path: string | undefined | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  const p = path.startsWith("/") ? path : `/${path}`;
  const gatewayPath = p.startsWith("/uploads") ? `/restaurant${p}` : p;
  return `${apiBase}${gatewayPath}`;
}


/** Format ISO or date string for dashboard tables (e.g. "Jan 15, 2025 at 2:30 PM") */
export function formatDateTime(value: string | number | Date | undefined | null): string {
  if (value == null) return "—";
  const d = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
