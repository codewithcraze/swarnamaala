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
  const ref = (searchParams.get("ref") || "").trim().toUpperCase();

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
      await register({ ...form, ref: ref || undefined });
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
      <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-charcoal">Create your account</h1>
        <p className="mt-1 text-sm text-muted">
          Sign up to upload photos and order your magnets.
        </p>

        {ref && (
          <p className="mt-4 rounded-lg bg-gold/15 px-4 py-2.5 text-sm text-terracotta-dark">
            🎁 You were invited with code <span className="font-semibold">{ref}</span> — your
            friend earns a reward when your order is delivered.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Full name</span>
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="input"
              placeholder="Your name"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Email</span>
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
            <span className="mb-1 block text-xs font-medium text-muted">Phone (optional)</span>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="input"
              placeholder="10-digit mobile"
              inputMode="numeric"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Password</span>
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
            <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-terracotta-dark disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href={`/signin?redirect=${encodeURIComponent(redirect)}`}
            className="font-semibold text-terracotta hover:text-terracotta-dark"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
