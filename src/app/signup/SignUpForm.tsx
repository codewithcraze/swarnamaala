"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function SignUpForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/products/custom-magnets";

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="mt-1 text-sm text-slate-400">
          Sign up to upload photos and order your magnets.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Full name</span>
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="input"
              placeholder="Your name"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">
              Phone (optional)
            </span>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="input"
              placeholder="10-digit mobile"
              inputMode="numeric"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="input"
              placeholder="At least 6 characters"
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href={`/signin?redirect=${encodeURIComponent(redirect)}`}
            className="font-semibold text-blue-400 hover:text-blue-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
