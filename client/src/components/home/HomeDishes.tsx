"use client";

import TopMenuItems from "@/components/TopMenuItems";


export function HomeDishes() {
  return (
    <section
      id="dishes"
      className="min-h-screen w-full flex flex-col justify-center py-24 sm:py-32 opacity-0 animate-fade-in-up"
      style={{ backgroundColor: "var(--surface-cream)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-[15vh]">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-stone-800 tracking-tight opacity-0 animate-fade-in-up animation-delay-100">
          Popular dishes
        </h2>
        <p className="mt-3 text-stone-600 text-lg max-w-xl opacity-0 animate-fade-in-up animation-delay-200">
          Bestsellers from our partner restaurants.
        </p>
        <div className="mt-14 opacity-0 animate-fade-in-up animation-delay-300">
          <TopMenuItems />
        </div>
      </div>
    </section>
  );
}
