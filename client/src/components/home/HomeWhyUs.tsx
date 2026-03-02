"use client";

import { Truck, Shield, Clock, Heart } from "lucide-react";


const REASONS = [
  {
    icon: Truck,
    title: "Fast delivery",
    description: "Hot food delivered to your door in no time.",
  },
  {
    icon: Shield,
    title: "Safe & secure",
    description: "Secure payments and verified restaurant partners.",
  },
  {
    icon: Clock,
    title: "Order anytime",
    description: "Browse and order when it suits you.",
  },
  {
    icon: Heart,
    title: "Made with care",
    description: "Real ingredients from local restaurants.",
  },
];


export function HomeWhyUs() {
  return (
    <section
      id="why-us"
      className="min-h-screen w-full flex flex-col justify-center py-24 sm:py-32"
      style={{ backgroundColor: "var(--surface-warm)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-stone-800 tracking-tight opacity-0 animate-fade-in-up">
          Why choose Bitez
        </h2>
        <p className="mt-3 text-stone-600 text-lg max-w-xl mb-20 opacity-0 animate-fade-in-up animation-delay-100">
          We make ordering food simple, fast, and reliable.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {REASONS.map((item, i) => (
            <div
              key={item.title}
              className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-sm opacity-0 animate-scale-in transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-[var(--brand)]/20"
              style={{ animationDelay: `${100 + i * 100}ms` }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl mb-5 transition-colors duration-300"
                style={{ backgroundColor: "color-mix(in oklch, var(--brand) 15%, white)" }}
              >
                <item.icon className="h-7 w-7 text-[var(--brand)]" />
              </div>
              <h3 className="font-display text-xl font-semibold text-stone-800">{item.title}</h3>
              <p className="mt-2 text-stone-600 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
