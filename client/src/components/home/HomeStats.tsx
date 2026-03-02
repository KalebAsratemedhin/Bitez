"use client";


const STATS = [
  { value: "500+", label: "Restaurant partners" },
  { value: "50k+", label: "Orders delivered" },
  { value: "4.8", label: "Average rating" },
  { value: "24/7", label: "Support" },
];


export function HomeStats() {
  return (
    <section
      id="stats"
      className="min-h-screen w-full flex flex-col justify-center py-24 sm:py-32 bg-stone-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight text-center mb-20 opacity-0 animate-fade-in-up">
          Trusted by food lovers
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="text-center opacity-0 animate-fade-in-up transition-transform duration-300 hover:scale-105"
              style={{ animationDelay: `${150 + i * 100}ms` }}
            >
              <p className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--brand)]">
                {stat.value}
              </p>
              <p className="mt-2 text-stone-400 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
