"use client";

import Link from "next/link";


export function HomeHeroMessage() {
  return (
    <section
      className="relative min-h-screen h-screen w-full flex flex-col justify-center items-center px-4 sm:px-6"
      style={{
        background:
          "linear-gradient(180deg, #44403c 0%, #292524 40%, #1c1917 70%, #0c0a09 100%)",
      }}
    >
      <div className="max-w-4xl mx-auto text-center">
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
