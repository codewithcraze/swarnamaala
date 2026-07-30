import type { Metadata } from "next";
import LegalPage, { Section } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How swarnamaala.in collects, uses and protects your personal data and uploaded photos.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 2026">
      <Section heading="1. Information We Collect">
        <p>
          We collect your name, email, phone number and shipping address to process orders,
          and the photos you upload to create your magnets. We also store your referral
          activity to calculate rewards.
        </p>
      </Section>
      <Section heading="2. How We Use Your Data">
        <p>
          Your data is used to fulfil and deliver orders, provide customer support, operate the
          referral program, and communicate order updates. We do not sell your personal data.
        </p>
      </Section>
      <Section heading="3. Your Photos">
        <p>
          Uploaded photos are stored securely and used only to produce your order. They are not
          shared with third parties except as needed for printing and delivery.
        </p>
      </Section>
      <Section heading="4. Payment Information">
        <p>
          Payments are processed by trusted third-party payment gateways. We do not store your
          full card or banking details on our servers.
        </p>
      </Section>
      <Section heading="5. Cookies">
        <p>
          We use essential cookies to keep you signed in and to operate the site. We do not use
          them to track you across other websites.
        </p>
      </Section>
      <Section heading="6. Data Retention & Your Rights">
        <p>
          You may request access to or deletion of your personal data by contacting us. We
          retain order records as required for tax and accounting purposes.
        </p>
      </Section>
      <Section heading="7. Contact">
        <p>
          Questions about privacy? Email{" "}
          <a href="mailto:hello@swarnamaala.in" className="text-terracotta hover:underline">
            hello@swarnamaala.in
          </a>{" "}
          or WhatsApp +91 90842 48821.
        </p>
      </Section>
    </LegalPage>
  );
}
