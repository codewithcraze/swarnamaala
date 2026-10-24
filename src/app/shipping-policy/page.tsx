import type { Metadata } from "next";
import LegalPage, { Section } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description: "Delivery timelines, same-day delivery zones and shipping charges for swarnamaala.in.",
  alternates: { canonical: "/shipping-policy" },
};

export default function ShippingPolicyPage() {
  return (
    <LegalPage title="Shipping Policy" updated="July 2026">
      <Section heading="1. Dispatch Time">
        <p>
          Orders are typically produced and dispatched within 24–48 hours of confirmation. You
          will be notified once your order is on its way.
        </p>
      </Section>
      <Section heading="3. Pan-India Shipping">
        <p>
          For the rest of India, delivery usually takes 3–7 business days depending on your
          location and courier availability.
        </p>
      </Section>
      <Section heading="4. Shipping Charges">
        <p>
          Shipping charges, if any, are shown at checkout. Delivery timelines are estimates and
          may vary due to courier delays, weather, or other factors outside our control.
        </p>
      </Section>
      <Section heading="5. Tracking & Support">
        <p>
          For delivery updates, contact us at{" "}
          <a href="mailto:swarnamaala.in@gmail.com" className="text-terracotta hover:underline">
            swarnamaala.in@gmail.com
          </a>{" "}
          or WhatsApp +91 836 805 9837.
        </p>
      </Section>
    </LegalPage>
  );
}
