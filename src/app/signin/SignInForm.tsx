"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function SignInForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/products/fridge-magnets";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-400">Sign in to place your order.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Your password"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-rose-500/15 px-4 py-2.5 text-sm text-rose-300">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          New here?{" "}
          <Link
            href={`/signup?redirect=${encodeURIComponent(redirect)}`}
            className="font-semibold text-blue-400 hover:text-blue-300"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
