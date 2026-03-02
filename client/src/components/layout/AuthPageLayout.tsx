"use client";

import Link from "next/link";

type AuthPageLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
};

export function AuthPageLayout({
  children,
  title,
  subtitle,
}: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-[48%] lg:w-[52%] relative overflow-hidden bg-stone-800">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{
            backgroundImage:
              "url('/Yetsom Beyaynetu (Ethiopian Combination Platter).jpeg')",
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-2xl font-bold text-white"
          >
            <img src="/bitez-logo.svg" alt="" className="h-8 w-8 shrink-0" />
            Bitez
          </Link>
          <div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-3">
              {title}
            </h1>
            {subtitle && (
              <p className="text-white/80 text-lg max-w-sm">{subtitle}</p>
            )}
          </div>
          <p className="text-white/60 text-sm">
            © Bitez — Food delivery you can trust
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-6 md:py-8 bg-[var(--surface-warm)] min-h-0 overflow-auto">
        <div className="md:hidden mb-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-xl font-bold text-stone-800"
          >
            <img src="/bitez-logo.svg" alt="" className="h-6 w-6 shrink-0" />
            Bitez
          </Link>
        </div>
        <div className="w-full max-w-md mx-auto">{children}</div>
      </div>
    </div>
  );
}
