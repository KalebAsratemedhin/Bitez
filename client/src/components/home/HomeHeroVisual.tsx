"use client";

import Link from "next/link";
import Carousel from "@/components/Carousel";


export function HomeHeroVisual() {
  return (
    <section className="group relative h-screen w-full overflow-hidden border-b-2 border-stone-900">
      <div className="absolute inset-0 h-screen w-full">
        <Carousel fullScreen />
      </div>
      <div
        className="absolute inset-0 z-[1] pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(180deg, rgba(41,37,36,0.35) 0%, rgba(28,25,23,0.5) 50%, rgba(12,10,9,0.65) 100%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-center items-center px-4 sm:px-6 pointer-events-auto z-10">
        <div className="max-w-4xl mx-auto text-center py-10 px-6 sm:py-12 sm:px-10">
          <p className="text-white text-sm font-medium tracking-[0.3em] uppercase mb-6 opacity-0 animate-fade-in-up animation-delay-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            Ethiopian flavors & more
          </p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[0.95] mb-6 opacity-0 animate-fade-in-up animation-delay-200 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            Real food,
            <br />
            <span className="italic">delivered</span>
          </h1>
          <p className="text-white text-lg sm:text-xl max-w-xl mx-auto mb-12 leading-relaxed opacity-0 animate-fade-in-up animation-delay-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            Order from the best local restaurants. Right to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0 animate-fade-in-up animation-delay-400">
            <Link
              href="/restaurants"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-white text-[var(--brand)] px-8 py-4 text-base font-semibold hover:bg-stone-100 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-100"
            >
              Browse restaurants
            </Link>
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-white/90 text-white px-8 py-4 text-base font-semibold hover:bg-white/10 hover:border-white transition-all duration-300 hover:scale-105 active:scale-100"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
