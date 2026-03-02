"use client";

const FEATURES = [
  {
    step: "01",
    title: "Browse",
    description: "Find top-rated restaurants and browse their menus.",
    image: "/Dukamo coffee, Addis Ababa, Ethiopia_.jpeg",
  },
  {
    step: "02",
    title: "Order",
    description: "Customize your meals and pay online or on delivery.",
    image: "/The Migrant Kitchen Ep_ 1_ Chirmol - Life & Thyme.jpeg",
  },
  {
    step: "03",
    title: "Enjoy",
    description: "Get your dishes delivered hot and fresh.",
    image:
      "/Food delivery drivers are driving to deliver products for customers who order online_ The impact of the epidemic has increased online purchases.jpeg",
  },
];


export function HomeHowItWorks() {
  return (
    <section className="min-h-screen w-full bg-white flex flex-col justify-center py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-stone-800 tracking-tight opacity-0 animate-fade-in-up">
          How it works
        </h2>
        <p className="mt-3 text-stone-600 text-lg max-w-xl mb-20 opacity-0 animate-fade-in-up animation-delay-100">
          From browsing to enjoying your meal — simple and fast.
        </p>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="group opacity-0 animate-fade-in-up transition-transform duration-500 hover:-translate-y-2"
              style={{ animationDelay: `${150 + i * 120}ms` }}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:rounded-2xl shadow-lg transition-all duration-500 group-hover:shadow-2xl group-hover:scale-[1.02]">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div
                  className="absolute inset-0 flex flex-col justify-end p-6 text-white"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)",
                  }}
                >
                  <span className="text-4xl font-display font-bold text-white/90 tracking-tight">
                    {feature.step}
                  </span>
                  <h3 className="font-display text-xl font-semibold mt-1">{feature.title}</h3>
                  <p className="text-sm text-white/90 mt-1">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
