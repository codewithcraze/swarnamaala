import type { Metadata } from "next";
import LegalPage, { Section } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using swarnamaala.in and placing orders for custom photo magnets.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="July 2026">
      <Section heading="1. Overview">
        <p>
          These terms govern your use of swarnamaala.in and any orders you place with us.
          By accessing the site or placing an order, you agree to these terms.
        </p>
      </Section>
      <Section heading="2. Orders & Products">
        <p>
          All products are made-to-order using the photos and details you provide. You are
          responsible for ensuring you have the rights to use any images you upload. We may
          decline orders containing offensive, illegal, or copyrighted material.
        </p>
      </Section>
      <Section heading="3. Pricing & Taxes">
        <p>
          Prices are listed in Indian Rupees (INR) and are exclusive of 18% GST, which is
          added at checkout. Packs of 1, 3, 6 and 10 are available, and additional magnets
          beyond 10 are charged at ₹70 each. We reserve the right to change prices at any time.
        </p>
      </Section>
      <Section heading="4. Referral Program">
        <p>
          Referral rewards are credited to your wallet only after a referred order has been
          successfully delivered. We may modify or discontinue the referral program, and we
          reserve the right to withhold rewards in cases of misuse or fraud.
        </p>
      </Section>
      <Section heading="5. Intellectual Property">
        <p>
          All site content, branding and design belong to swarnamaala.in. Photos you upload
          remain yours; you grant us a limited licence to use them solely to fulfil your order.
        </p>
      </Section>
      <Section heading="6. Limitation of Liability">
        <p>
          Our liability for any order is limited to the amount paid for that order. We are not
          liable for indirect or consequential losses.
        </p>
      </Section>
      <Section heading="7. Contact">
        <p>
          For any questions about these terms, contact us at{" "}
          <a href="mailto:hello@swarnamaala.in" className="text-terracotta hover:underline">
            hello@swarnamaala.in
          </a>{" "}
          or WhatsApp +91 90842 48821.
        </p>
      </Section>
    </LegalPage>
  );
}
