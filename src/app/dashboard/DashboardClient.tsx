"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { CURRENCY_SYMBOL } from "@/lib/pricing";

type ReferralData = {
  code: string;
  referralUrl: string;
  walletBalance: number;
  pending: number;
  referredCount: number;
  recent: {
    id: string;
    friend: string;
    reward: number;
    status: string;
    credited: boolean;
    orderTotal: number;
    date: string;
  }[];
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gold/20 text-terracotta-dark",
  processing: "bg-sky-100 text-sky-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function DashboardClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/signin?redirect=/dashboard");
      return;
    }
    fetch("/api/referrals", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d.error ? null : d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  async function copyLink() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (authLoading || loading) {
    return <div className="py-24 text-center text-muted">Loading your rewards...</div>;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-lg font-semibold text-charcoal">Couldn&apos;t load your rewards</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-terracotta px-6 py-2.5 text-sm font-semibold text-white">
          Go home
        </Link>
      </div>
    );
  }

  const shareText = encodeURIComponent(
    `Make your memories magnetic with swarnamaala.in! Order custom photo magnets using my link: ${data.referralUrl}`
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-charcoal">Refer &amp; Earn</h1>
      <p className="mt-2 text-muted">
        Share your link with friends. You earn a reward on every order they place, credited
        once it&apos;s delivered.
      </p>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <p className="text-sm text-muted">Total earned</p>
          <p className="mt-1 text-3xl font-extrabold text-terracotta">
            {CURRENCY_SYMBOL}
            {data.walletBalance}
          </p>
          <p className="mt-1 text-xs text-muted">Credited to your wallet</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <p className="text-sm text-muted">Pending</p>
          <p className="mt-1 text-3xl font-extrabold text-gold">
            {CURRENCY_SYMBOL}
            {data.pending}
          </p>
          <p className="mt-1 text-xs text-muted">Credited after delivery</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <p className="text-sm text-muted">Friends joined</p>
          <p className="mt-1 text-3xl font-extrabold text-charcoal">{data.referredCount}</p>
          <p className="mt-1 text-xs text-muted">Signed up with your code</p>
        </div>
      </div>

      {/* Referral link */}
      <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-charcoal">Your referral link</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input readOnly value={data.referralUrl} className="input flex-1" />
          <button
            onClick={copyLink}
            className="cursor-pointer rounded-full bg-terracotta px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-dark"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted">
            Code: <span className="font-semibold text-charcoal">{data.code}</span>
          </span>
          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-charcoal hover:bg-cream"
          >
            Share on WhatsApp
          </a>
        </div>
      </div>

      {/* Reward tiers reminder */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { order: 399, reward: 29 },
          { order: 499, reward: 39 },
          { order: 699, reward: 49 },
        ].map((t) => (
          <div key={t.order} className="rounded-2xl border border-line bg-[#fdf1e6] p-5 text-center">
            <p className="text-xs font-medium text-muted">
              Order worth {CURRENCY_SYMBOL}
              {t.order}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-terracotta">
              Earn {CURRENCY_SYMBOL}
              {t.reward}
            </p>
          </div>
        ))}
      </div>

      {/* Recent referrals */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-charcoal">Referral activity</h2>
        {data.recent.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted shadow-sm">
            No referrals yet. Share your link to start earning!
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {data.recent.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-medium text-charcoal">{r.friend}</p>
                  <p className="text-xs text-muted">
                    Order {CURRENCY_SYMBOL}
                    {r.orderTotal}
                    {r.date
                      ? ` \u2022 ${new Date(r.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      STATUS_STYLES[r.status] ?? "bg-cream text-charcoal"
                    }`}
                  >
                    {r.status}
                  </span>
                  <span
                    className={`text-sm font-bold ${r.credited ? "text-emerald-600" : "text-gold"}`}
                  >
                    {r.credited ? "+" : ""}
                    {CURRENCY_SYMBOL}
                    {r.reward}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
