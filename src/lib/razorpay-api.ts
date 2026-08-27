// Server-side Razorpay REST client.
//
// We call the REST API directly with fetch instead of using the `razorpay` npm
// SDK. The SDK sends `User-Agent: razorpay-node@<version>` and that request was
// being rejected with 401 "Authentication failed" while a byte-identical request
// with a different User-Agent succeeded. Talking to the documented REST endpoints
// removes that whole class of problem and drops a dependency.
//
// Never import this from client components: it reads the key secret.

const API_BASE = "https://api.razorpay.com/v1";

export type RazorpayApiError = Error & {
  statusCode?: number;
  code?: string;
};

function credentials() {
  const keyId = process.env.RAZORPAYAPIKEY;
  const keySecret = process.env.RAZORPAYSECRETKEY;
  if (!keyId || !keySecret) {
    const err = new Error(
      "Razorpay is not configured. Set RAZORPAYAPIKEY and RAZORPAYSECRETKEY."
    ) as RazorpayApiError;
    err.code = "CONFIG_MISSING";
    throw err;
  }
  return { keyId, keySecret };
}

/** Public key id, safe to send to the browser for Checkout. */
export function getPublicKeyId(): string {
  return credentials().keyId;
}

async function request<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown } = { method: "GET" }
): Promise<T> {
  const { keyId, keySecret } = credentials();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      // Sent explicitly: Razorpay answers 401 "Authentication failed" when a
      // request arrives with no User-Agent, and Node's fetch does not always
      // set one. Verified against the live API.
      "User-Agent": "swarnamaala-next/1.0",
      Accept: "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    // Payment calls must never be served from a cache.
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const apiErr = (data as { error?: { description?: string; code?: string } })?.error;
    const err = new Error(
      apiErr?.description ?? `Razorpay request failed (HTTP ${res.status})`
    ) as RazorpayApiError;
    err.statusCode = res.status;
    err.code = apiErr?.code;
    throw err;
  }

  return data as T;
}

export type RazorpayOrder = {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: string;
  notes?: Record<string, string>;
};

export function createRazorpayOrder(params: {
  /** Amount in the smallest currency unit (paise for INR). */
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  return request<RazorpayOrder>("/orders", {
    method: "POST",
    body: {
      amount: params.amount,
      currency: params.currency ?? "INR",
      receipt: params.receipt,
      notes: params.notes,
    },
  });
}

export type RazorpayPayment = {
  id: string;
  order_id: string;
  status: string; // created | authorized | captured | refunded | failed
  amount: number;
  method?: string;
  error_code?: string | null;
  error_description?: string | null;
};

/** Look up a payment. Useful for reconciling a failed or ambiguous attempt. */
export function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  return request<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}
