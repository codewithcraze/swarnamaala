// Shared helpers that turn an order's status + payment fields into what the
// customer sees: one clear state, a progress timeline, and which actions apply.

export type OrderLike = {
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
};

export type ViewState =
  | "unpaid"
  | "failed"
  | "confirmed"
  | "printing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const TABS = [
  { key: "all", label: "All" },
  { key: "pay", label: "Needs payment" },
  { key: "progress", label: "In progress" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;
export type TabKey = (typeof TABS)[number]["key"];

export const isCod = (o: OrderLike) => o.paymentMethod === "cod";

export function viewState(o: OrderLike): ViewState {
  if (o.status === "cancelled") return "cancelled";
  if (o.status === "delivered") return "delivered";
  if (o.status === "shipped") return "shipped";
  if (o.status === "processing") return "printing";
  // pending
  if (isCod(o) || o.paymentStatus === "paid") return "confirmed";
  return o.paymentStatus === "failed" ? "failed" : "unpaid";
}

export const STATE_LABEL: Record<ViewState, { tone: "warn" | "bad" | "ok" | "muted"; text: string }> = {
  unpaid: { tone: "warn", text: "Awaiting payment" },
  failed: { tone: "bad", text: "Payment failed" },
  confirmed: { tone: "ok", text: "Confirmed" },
  printing: { tone: "ok", text: "Printing" },
  shipped: { tone: "ok", text: "Shipped" },
  delivered: { tone: "ok", text: "Delivered" },
  cancelled: { tone: "muted", text: "Cancelled" },
};

export const STATE_NOTE: Partial<Record<ViewState, string>> = {
  unpaid: "Your order will be confirmed once payment is complete.",
  failed: "We couldn't take your payment. Retry to confirm your order.",
  confirmed: "We've got your order and will start printing soon.",
  printing: "Your magnets are being printed and packed.",
  shipped: "Your magnets are on the way.",
  delivered: "Delivered. We hope they look great on your fridge!",
  cancelled: "This order was cancelled.",
};

export type Step = { label: string; state: "done" | "cur" | "bad" | "todo" };

// Timeline: Placed → Payment → Printing → Shipped → Delivered.
export function timeline(o: OrderLike): Step[] {
  const s = viewState(o);
  const labels = ["Order placed", isCod(o) ? "Cash on delivery" : "Payment", "Printing", "Shipped", "Delivered"];
  // Index of the last completed step.
  const reached: Record<ViewState, number> = {
    unpaid: 0, failed: 0, cancelled: 0, confirmed: 1, printing: 2, shipped: 3, delivered: 4,
  };
  const r = reached[s];
  return labels.map((label, i) => {
    if (i <= r) return { label, state: "done" };
    if (i === r + 1) {
      if (s === "failed") return { label, state: "bad" };
      if (s === "unpaid") return { label, state: "cur" };
      if (s === "cancelled") return { label, state: "todo" };
      return { label, state: "cur" };
    }
    return { label, state: "todo" };
  });
}

export function needsPayment(o: OrderLike) {
  const s = viewState(o);
  return !isCod(o) && (s === "unpaid" || s === "failed");
}

// Editing / cancelling is only allowed before we start working on the order.
export function canEdit(o: OrderLike) {
  return o.status === "pending" && o.paymentStatus !== "paid";
}

// MongoDB filter for each tab (used by the API).
export function tabFilter(tab: string): Record<string, unknown> {
  switch (tab) {
    case "pay":
      return {
        status: { $ne: "cancelled" },
        paymentMethod: { $ne: "cod" },
        paymentStatus: { $in: ["unpaid", "failed"] },
        $nor: [{ status: { $in: ["processing", "shipped", "delivered"] } }],
      };
    case "progress":
      return {
        $or: [
          { status: { $in: ["processing", "shipped"] } },
          { status: "pending", paymentStatus: "paid" },
          { status: "pending", paymentMethod: "cod" },
        ],
      };
    case "delivered":
      return { status: "delivered" };
    case "cancelled":
      return { status: "cancelled" };
    default:
      return {};
  }
}
