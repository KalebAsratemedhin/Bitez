import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";

export function Footer() {
  return (
    <footer className="bg-stone-800 text-stone-300 py-14 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10 text-sm">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-xl font-bold text-white"
          >
            <img src="/bitez-logo.svg" alt="" className="h-7 w-7 shrink-0 [filter:brightness(0)_invert(1)]" />
            Bitez
          </Link>
          <p className="mt-3 text-stone-400 max-w-xs">
            Bringing your favorite meals from your favorite restaurants right to
            your doorstep.
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Explore</h3>
          <ul className="space-y-2.5">
            <li>
              <Link href="/" className="hover:text-[var(--brand)] transition">
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/restaurants"
                className="hover:text-[var(--brand)] transition"
              >
                Restaurants
              </Link>
            </li>
            <li>
              <a
                href="/#dishes"
                className="hover:text-[var(--brand)] transition"
              >
                Popular dishes
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Help</h3>
          <ul className="space-y-2.5">
            <li>
              <a
                href="/terms"
                className="hover:text-[var(--brand)] transition"
              >
                Terms & conditions
              </a>
            </li>
            <li>
              <a
                href="/privacy"
                className="hover:text-[var(--brand)] transition"
              >
                Privacy policy
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Connect</h3>
          <div className="flex gap-4 text-lg">
            <a
              href="#"
              className="hover:text-[var(--brand)] transition"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>
            <a
              href="#"
              className="hover:text-[var(--brand)] transition"
              aria-label="Twitter"
            >
              <FaTwitter />
            </a>
            <a
              href="#"
              className="hover:text-[var(--brand)] transition"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            <a
              href="#"
              className="hover:text-[var(--brand)] transition"
              aria-label="LinkedIn"
            >
              <FaLinkedinIn />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-stone-700 text-center text-stone-500 text-sm">
        © {new Date().getFullYear()} Bitez. All rights reserved.
      </div>
    </footer>
  );
}
