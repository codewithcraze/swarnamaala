import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank you for your order",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ order?: string; success?: string }> };

// Shown after a guest checkout when the customer isn't signed in on this
// browser (their email already belonged to an account).
export default async function ThankYouPage({ searchParams }: Props) {
  const { order, success } = await searchParams;
  const shortId = /^[a-f0-9]{24}$/i.test(order ?? "") ? order!.slice(-8).toUpperCase() : null;
  const cod = success === "cod";

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:py-24">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-terracotta/15 text-terracotta">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mt-6 text-3xl font-extrabold text-charcoal">Thank you! Your order is placed.</h1>
      {shortId && <p className="mt-2 text-muted">Order #{shortId}</p>}
      <p className="mt-4 text-charcoal">
        {cod
          ? "You'll pay when your magnets arrive. "
          : "Your payment was successful. "}
        We've emailed your order confirmation and will email you again as your magnets are made and shipped.
      </p>
      <p className="mt-3 text-sm text-muted">
        This email already has a Swarnamaala account, so the order was added to it. Sign in any time to see it under My Orders.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-onaccent">
          Back to home
        </Link>
        <Link href="/signin?redirect=/orders" className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-charcoal">
          View my orders
        </Link>
      </div>
    </div>
  );
}
