"use client";

import TopRestaurants from "@/components/TopRestaurants";
import Link from "next/link";


export function HomeRestaurants() {
  return (
    <section
      id="restaurants"
      className="min-h-screen w-full bg-stone-950 flex flex-col justify-center py-24 sm:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-[15vh]">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div className="opacity-0 animate-fade-in-up animation-delay-100">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              Top rated restaurants
            </h2>
            <p className="mt-3 text-stone-400 text-lg max-w-md">
              Favorites near you — order for delivery or pickup.
            </p>
          </div>
          <Link
            href="/restaurants"
            className="text-[var(--brand)] font-semibold hover:underline underline-offset-4 shrink-0 transition-all duration-300 hover:scale-105 opacity-0 animate-fade-in-up animation-delay-200"
          >
            View all →
          </Link>
        </div>
        <div className="opacity-0 animate-fade-in-up animation-delay-200">
          <TopRestaurants variant="dark" />
        </div>
    
      </div>
    </section>
  );
}
