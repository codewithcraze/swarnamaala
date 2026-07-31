"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import Logo from "./Logo";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products/custom-magnets", label: "Custom Magnets" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/#reviews", label: "Reviews" },
];

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Lock body scroll while the full-screen mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-t border-[#340d00] border-line bg-cream/85 backdrop-blur-md">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo onClick={() => setOpen(false)} priority />

          <div className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-terracotta ${
                  pathname === link.href ? "text-terracotta" : "text-charcoal/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            {!loading && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-charcoal/80 transition-colors hover:text-terracotta"
                >
                  Rewards
                </Link>
                <Link
                  href="/orders"
                  className="text-sm font-medium text-charcoal/80 transition-colors hover:text-terracotta"
                >
                  My Orders
                </Link>
                <button
                  onClick={() => logout()}
                  className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-white"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-sm font-medium text-charcoal/80 transition-colors hover:text-terracotta"
                >
                  Sign in
                </Link>
                <Link
                  href="/products/custom-magnets"
                  className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-terracotta-dark"
                >
                  Order Now
                </Link>
              </>
            )}
          </div>

          <button
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-lg text-charcoal lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </nav>
      </header>

      {/* Full-screen mobile menu (outside the blurred header so it covers the viewport). */}
      {open && (
        <div className="fixed inset-0 z-[100] flex h-[100dvh] flex-col bg-cream lg:hidden">
          <div className="flex h-20 items-center justify-between border-b border-line px-4 sm:px-6">
            <Logo onClick={() => setOpen(false)} />
            <button
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-lg text-charcoal"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-4 py-4 text-xl font-semibold transition-colors hover:bg-white ${
                    pathname === link.href ? "text-terracotta" : "text-charcoal"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3 pt-8">
              {!loading && user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-line px-6 py-3.5 text-center text-base font-semibold text-charcoal transition-colors hover:bg-white"
                  >
                    Referral Rewards
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-line px-6 py-3.5 text-center text-base font-semibold text-charcoal transition-colors hover:bg-white"
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="cursor-pointer rounded-full border border-line px-6 py-3.5 text-center text-base font-semibold text-charcoal transition-colors hover:bg-white"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/signin"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-line px-6 py-3.5 text-center text-base font-semibold text-charcoal transition-colors hover:bg-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/products/custom-magnets"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-terracotta px-6 py-3.5 text-center text-base font-semibold text-white shadow-sm"
                  >
                    Order Now
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
