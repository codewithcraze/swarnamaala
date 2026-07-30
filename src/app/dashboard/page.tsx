import type { Metadata } from "next";
import { Suspense } from "react";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Refer & Earn",
  description: "Your referral dashboard — share your link and track your earnings.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-muted">Loading...</div>}>
      <DashboardClient />
    </Suspense>
  );
}
