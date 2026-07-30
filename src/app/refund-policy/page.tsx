import type { Metadata } from "next";
import LegalPage, { Section } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Refund, replacement and cancellation policy for custom photo magnet orders at swarnamaala.in.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund & Cancellation Policy" updated="July 2026">
      <Section heading="1. Made-to-Order Products">
        <p>
          Our magnets are personalised and made-to-order using your photos, so they generally
          cannot be resold. Please review your photos and order details carefully before placing
          an order.
        </p>
      </Section>
      <Section heading="2. Cancellations">
        <p>
          You can cancel or edit your order for free while it is still in the{" "}
          <span className="font-semibold text-charcoal">pending</span> status, directly from your
          Orders page. Once an order moves to processing or printing, it can no longer be
          cancelled.
        </p>
      </Section>
      <Section heading="3. Damaged or Defective Items">
        <p>
          If your magnets arrive damaged, defective, or printed incorrectly on our part, we will
          reprint and reship them free of charge, or issue a full refund. Please contact us within
          48 hours of delivery with photos of the issue.
        </p>
      </Section>
      <Section heading="4. Refund Method & Timeline">
        <p>
          Approved refunds are processed to your original payment method within 5–7 business days.
          Referral wallet rewards linked to a refunded order will be reversed.
        </p>
      </Section>
      <Section heading="5. Non-Refundable Cases">
        <p>
          We cannot offer refunds for issues caused by low-resolution or incorrect photos provided
          by the customer, or for change-of-mind after production has begun.
        </p>
      </Section>
      <Section heading="6. How to Request">
        <p>
          To request a cancellation or refund, contact us at{" "}
          <a href="mailto:hello@swarnamaala.in" className="text-terracotta hover:underline">
            hello@swarnamaala.in
          </a>{" "}
          or WhatsApp +91 90842 48821 with your order details.
        </p>
      </Section>
    </LegalPage>
  );
}
