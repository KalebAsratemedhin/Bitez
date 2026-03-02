"use client";

import Link from "next/link";
import Carousel from "@/components/Carousel";


export function HomeHero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-end overflow-hidden">
      <Carousel />
      <div
        className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div className="absolute left-0 top-1/2 w-px h-24 -translate-y-1/2 bg-white/40 hidden lg:block animate-fade-in animation-delay-300" />
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto pointer-events-auto py-20">
        <p className="text-white/90 text-sm font-medium tracking-[0.3em] uppercase mb-6 opacity-0 animate-fade-in-up animation-delay-100">
          Ethiopian flavors & more
        </p>
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[0.95] mb-6 opacity-0 animate-fade-in-up animation-delay-200">
          Real food,
          <br />
          <span className="italic">delivered</span>
        </h1>
        <p className="text-white/90 text-lg sm:text-xl max-w-xl mx-auto mb-12 leading-relaxed opacity-0 animate-fade-in-up animation-delay-300">
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
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-white/80 text-white px-8 py-4 text-base font-semibold hover:bg-white/10 hover:border-white transition-all duration-300 hover:scale-105 active:scale-100"
          >
            Create account
          </Link>
        </div>
      </div>
    </section>
  );
}
