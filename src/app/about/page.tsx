import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about swarnamaala.in — premium custom photo magnets made with love in India, with same-day delivery across Delhi NCR.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-charcoal sm:text-4xl">About swarnamaala.in</h1>
      <p className="mt-3 text-lg font-medium text-terracotta">
        Your memories, our magnets. Made with love, made to stick.
      </p>

      <div className="mt-8 space-y-5 leading-relaxed text-muted">
        <p>
          swarnamaala.in turns your favourite photos into premium, durable custom magnets.
          Whether it&apos;s a family portrait, a wedding memory, your pet, a travel snap or
          a brand logo, we print it beautifully and deliver it to your door.
        </p>
        <p>
          Every magnet is made with a premium photo print, a thick foam layer and a strong,
          long-lasting magnet back — so your memories stay vibrant and hold firmly for years.
        </p>
        <p>
          We offer <span className="font-semibold text-charcoal">same-day delivery in Noida,
          Delhi &amp; Ghaziabad</span> (or within 24–48 hours max) and ship across India.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { title: "High quality print", desc: "Vibrant, long-lasting finish." },
          { title: "Strong magnet", desc: "Holds firmly, built to last." },
          { title: "Safe packaging", desc: "Delivered with care." },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-charcoal">{f.title}</h2>
            <p className="mt-1 text-sm text-muted">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-charcoal">Get in touch</h2>
        <p className="mt-2 text-sm text-muted">
          Questions or bulk orders? Reach us on WhatsApp at{" "}
          <a href="https://wa.me/919084248821" className="font-medium text-terracotta hover:underline">
            +91 90842 48821
          </a>{" "}
          or visit our{" "}
          <Link href="/contact" className="font-medium text-terracotta hover:underline">
            contact page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
