"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products/custom-magnets", label: "Custom Magnets" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#pricing", label: "Pricing" },
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
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#050a18]/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="text-xl font-bold tracking-tight text-white">
              swarnamaala
              <span className="text-blue-400">.in</span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                  pathname === link.href ? "text-blue-400" : "text-slate-300"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {!loading && user ? (
              <>
                <Link
                  href="/orders"
                  className="text-sm font-medium text-slate-300 transition-colors hover:text-blue-400"
                >
                  My Orders
                </Link>
                <span className="hidden text-sm text-slate-500 lg:inline">
                  Hi, {user.name.split(" ")[0]}
                </span>
                <button
                  onClick={() => logout()}
                  className="cursor-pointer rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-sm font-medium text-slate-300 transition-colors hover:text-blue-400"
                >
                  Sign in
                </Link>
                <Link
                  href="/products/custom-magnets"
                  className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-transform hover:scale-[1.03]"
                >
                  Order Now
                </Link>
              </>
            )}
          </div>

          <button
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg text-white md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </nav>
      </header>

      {/* Full-screen mobile menu (rendered outside the blurred header so it can
          cover the full viewport). */}
      {open && (
        <div className="fixed inset-0 z-[100] flex h-[100dvh] flex-col bg-[#050a18] md:hidden">
          <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
            <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <span className="text-xl font-bold tracking-tight text-white">
                swarnamaala
                <span className="text-blue-400">.in</span>
              </span>
            </Link>
            <button
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg text-white"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  className={`rounded-xl px-4 py-4 text-xl font-semibold transition-colors hover:bg-slate-800/60 ${
                    pathname === link.href ? "text-blue-400" : "text-slate-100"
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
                    href="/orders"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-slate-700 px-6 py-3.5 text-center text-base font-semibold text-slate-100 transition-colors hover:bg-slate-800"
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="cursor-pointer rounded-full border border-slate-700 px-6 py-3.5 text-center text-base font-semibold text-slate-100 transition-colors hover:bg-slate-800"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/signin"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-slate-700 px-6 py-3.5 text-center text-base font-semibold text-slate-100 transition-colors hover:bg-slate-800"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/products/custom-magnets"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-blue-500/25"
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
