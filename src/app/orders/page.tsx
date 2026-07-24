import type { Metadata } from "next";
import { Suspense } from "react";
import OrdersClient from "./OrdersClient";

export const metadata: Metadata = {
  title: "My Orders",
  description: "View and track your custom fridge magnet orders.",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-slate-500">Loading...</div>}>
      <OrdersClient />
    </Suspense>
  );
}
