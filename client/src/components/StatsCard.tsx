import { cn } from "@/lib/utils";


export function StatsCard({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[var(--brand)]"
            style={{ backgroundColor: "color-mix(in oklch, var(--brand) 12%, transparent)" }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-stone-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
