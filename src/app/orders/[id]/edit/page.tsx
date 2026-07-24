import type { Metadata } from "next";
import { Suspense } from "react";
import EditOrderClient from "./EditOrderClient";

export const metadata: Metadata = {
  title: "Edit Order",
  description: "Edit your custom photo magnet order.",
  robots: { index: false, follow: false },
};

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-24 text-center text-slate-500">Loading...</div>}>
      <EditOrderClient orderId={id} />
    </Suspense>
  );
}
