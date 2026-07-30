import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact swarnamaala.in for orders, support and bulk enquiries. WhatsApp, email and business address.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-charcoal sm:text-4xl">Contact Us</h1>
      <p className="mt-3 text-muted">
        We&apos;d love to hear from you. Reach out for orders, support or bulk enquiries.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-charcoal">WhatsApp &amp; Phone</h2>
          <a
            href="https://wa.me/919084248821"
            className="mt-2 block text-lg font-semibold text-terracotta hover:underline"
          >
            +91 90842 48821
          </a>
          <p className="mt-1 text-sm text-muted">Fastest way to reach us. 10am–8pm, all days.</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-charcoal">Email</h2>
          <a
            href="mailto:hello@swarnamaala.in"
            className="mt-2 block text-lg font-semibold text-terracotta hover:underline"
          >
            hello@swarnamaala.in
          </a>
          <p className="mt-1 text-sm text-muted">We reply within 24 hours.</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:col-span-2">
          <h2 className="font-semibold text-charcoal">Business Address</h2>
          <p className="mt-2 text-sm text-muted">
            swarnamaala.in
            <br />
            Noida, Uttar Pradesh, India
          </p>
          <p className="mt-2 text-sm text-muted">
            Same-day delivery available in Noida, Delhi &amp; Ghaziabad. Pan-India shipping.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-charcoal">Send us a message</h2>
        <form
          className="mt-4 space-y-4"
          action="https://wa.me/919084248821"
          method="get"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Your name</span>
              <input className="input" placeholder="Your name" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Phone / Email</span>
              <input className="input" placeholder="How can we reach you?" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Message</span>
            <textarea className="input min-h-28 resize-y" placeholder="Tell us what you need" />
          </label>
          <a
            href="https://wa.me/919084248821"
            className="inline-block rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta-dark"
          >
            Chat on WhatsApp
          </a>
        </form>
      </div>
    </div>
  );
}
