"use client";

import Link from "next/link";


const STATS = [
  { value: "500+", label: "Restaurant partners" },
  { value: "50k+", label: "Orders delivered" },
  { value: "4.8", label: "Average rating" },
  { value: "24/7", label: "Support" },
];


export function HomeStatsCta() {
  return (
    <section
      id="join"
      className="relative min-h-screen h-screen w-full overflow-hidden flex flex-col justify-center items-center py-16 sm:py-20 px-4 sm:px-6"
      style={{
        background:
          "linear-gradient(135deg, #b8451a 0%, #9a3a16 40%, #7c2f12 70%, #5c2310 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%)`,
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />
      <div className="relative w-full max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-14 lg:gap-16">
        <div className="flex-1">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-[0.25em] mb-6 opacity-0 animate-fade-in-up">
            Trusted by food lovers
          </p>
          <div className="grid grid-cols-2 gap-6 sm:gap-8">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="group opacity-0 animate-fade-in-up transition-all duration-300 hover:scale-105"
                style={{ animationDelay: `${80 + i * 100}ms` }}
              >
                <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm px-6 py-5 sm:px-8 sm:py-6 transition-colors duration-300 group-hover:bg-white/10 group-hover:border-white/25">
                  <p className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-white/80 text-sm font-medium leading-snug">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 lg:max-w-md lg:pl-8">
          <div className="relative rounded-3xl border-2 border-white/20 bg-white/10 backdrop-blur-md p-8 sm:p-10 opacity-0 animate-fade-in-up animation-delay-200">
            <div className="absolute -top-3 left-8 px-3 py-0.5 rounded-full bg-white/20 text-white/90 text-xs font-semibold uppercase tracking-wider">
              Join us
            </div>
            <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mt-2">
              Partner with Bitez
            </h3>
            <p className="mt-4 text-white/90 text-base sm:text-lg leading-relaxed">
              Join our network of restaurants and delivery partners. Reach customers who love great food.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-white text-[var(--brand)] font-semibold px-7 py-3.5 hover:bg-stone-100 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-100"
              >
                Sign up
              </Link>
              <Link
                href="/signin"
                className="inline-flex items-center justify-center rounded-full border-2 border-white/80 text-white font-semibold px-7 py-3.5 hover:bg-white/15 hover:border-white transition-all duration-300 hover:scale-105 active:scale-100"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
