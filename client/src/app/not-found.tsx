import Link from "next/link";


export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "var(--surface-warm)" }}>
      <h1 className="font-display text-4xl font-bold text-stone-800 mb-2">Page not found</h1>
      <p className="text-stone-600 mb-6">The page you’re looking for doesn’t exist.</p>
      <Link
        href="/"
        className="rounded-full bg-[var(--brand)] px-6 py-3 text-white font-semibold hover:bg-[var(--brand-hover)] transition"
      >
        Go home
      </Link>
    </div>
  );
}
