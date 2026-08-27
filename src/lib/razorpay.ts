// Dynamically loads the Razorpay JS SDK from their CDN (browser only)
// and opens the payment modal.

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("Not in browser"));
    if (window.Razorpay) return resolve(); // already loaded

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.head.appendChild(script);
  });
}

export type PaymentResult =
  | { success: true; paymentId: string; signature: string; razorpayOrderId: string }
  | {
      success: false;
      error: string;
      // Present when Razorpay reports an actual payment.failed event (as opposed
      // to the user simply dismissing the modal). Lets the CRM show the real
      // payment id and reason for the failed attempt.
      paymentId?: string;
      code?: string;
    };

export async function openRazorpayCheckout(opts: {
  rzpOrderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  prefill: { name: string; contact: string; email: string };
  description: string;
}): Promise<PaymentResult> {
  await loadScript();

  return new Promise((resolve) => {
    let settled = false;
    const settle = (r: PaymentResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };

    const rzp = new window.Razorpay({
      key: opts.keyId,
      order_id: opts.rzpOrderId,
      amount: opts.amount,
      currency: opts.currency,
      name: "swarnamaala.in",
      description: opts.description,
      image: "/logo.png",
      prefill: opts.prefill,
      theme: { color: "#D97757" }, // terracotta brand color
      modal: {
        ondismiss: () =>
          settle({ success: false, error: "Payment cancelled by user." }),
      },
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        settle({
          success: true,
          paymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
        });
      },
    });

    // Fired when a payment attempt genuinely fails (declined card, failed auth,
    // insufficient funds, etc.). This carries the real payment id + error so the
    // CRM can record a meaningful failed entry.
    rzp.on("payment.failed", (resp: {
      error?: {
        code?: string;
        description?: string;
        reason?: string;
        metadata?: { payment_id?: string; order_id?: string };
      };
    }) => {
      const err = resp?.error;
      settle({
        success: false,
        error: err?.description || err?.reason || "Payment failed.",
        paymentId: err?.metadata?.payment_id,
        code: err?.code,
      });
    });

    rzp.open();
  });
}
