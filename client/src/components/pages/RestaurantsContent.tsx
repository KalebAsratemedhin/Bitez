import ActiveRestaurants from "@/components/ActiveRestaurants";

export function RestaurantsContent() {
  return (
    <div className="w-full">
      <section className="relative py-4 overflow-hidden w-full">
        {/* <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, var(--brand) 0%, transparent 50%),
                             radial-gradient(circle at 80% 80%, var(--brand) 0%, transparent 40%)`,
          }}
        /> */}
        <h1 className="font-display text-2xl sm:text-2xl font-normal text-stone-900 tracking-tight">
            Discover and order from the best local spots.
        </h1>
      </section>
      <section className="w-full px-0 pb-6">
        <ActiveRestaurants />
      </section>
    </div>
  );
}
