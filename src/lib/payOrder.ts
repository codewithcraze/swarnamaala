import { openRazorpayCheckout } from "@/lib/razorpay";

// Pays for an existing unpaid order with Razorpay: create rzp order → open
// checkout → verify. Failures are recorded so they show in the CRM.
// Resolves to the payment id, or throws with a user-facing message.
export async function payOrder(orderId: string, description: string): Promise<string> {
  const recordFailure = (reason: string, razorpayPaymentId?: string) =>
    fetch("/api/payment/failed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason, razorpayPaymentId }),
    }).catch(() => {});

  try {
    const createRes = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(createData.error ?? "Could not initiate payment");

    const result = await openRazorpayCheckout({
      rzpOrderId: createData.rzpOrderId,
      amount: createData.amount,
      currency: createData.currency,
      keyId: createData.keyId,
      prefill: createData.prefill,
      description,
    });
    if (!result.success) {
      await recordFailure(result.error, result.paymentId);
      throw new Error(result.error);
    }

    const verifyRes = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        razorpayOrderId: result.razorpayOrderId,
        razorpayPaymentId: result.paymentId,
        razorpaySignature: result.signature,
      }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) {
      await recordFailure(verifyData.error ?? "Payment verification failed", result.paymentId);
      throw new Error(verifyData.error ?? "Payment verification failed");
    }
    return result.paymentId;
  } catch (err) {
    throw err instanceof Error ? err : new Error("Payment failed. Please try again.");
  }
}
