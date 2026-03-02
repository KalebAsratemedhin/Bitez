"use client";

import Link from "next/link";


export function HomeCta() {
  return (
    <section
      id="join"
      className="min-h-screen relative w-full overflow-hidden flex flex-col justify-center py-24 sm:py-32"
      style={{ backgroundColor: "var(--brand)" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.15),transparent)]" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight opacity-0 animate-fade-in-up">
          Partner with Bitez
        </h2>
        <p className="mt-6 text-white/90 text-lg sm:text-xl leading-relaxed opacity-0 animate-fade-in-up animation-delay-100">
          Join our network of restaurants and delivery partners. Reach customers who love great food.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4 opacity-0 animate-fade-in-up animation-delay-200">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-white text-[var(--brand)] font-semibold px-8 py-4 hover:bg-stone-100 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-100"
          >
            Sign up
          </Link>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-full border-2 border-white text-white font-semibold px-8 py-4 hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-100"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
