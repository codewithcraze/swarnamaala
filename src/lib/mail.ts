import nodemailer from "nodemailer";

// Gmail / Google Workspace SMTP using an App Password.
const MAIL_USER = process.env.MAIL_USER || "";
const APP_PASS = (process.env.APPPASSCODE || "").replace(/\s+/g, "");
const MAIL_FROM = process.env.MAIL_FROM || MAIL_USER;

type Transporter = ReturnType<typeof nodemailer.createTransport>;
let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!MAIL_USER || !APP_PASS) {
    console.warn("[mail] MAIL_USER or APPPASSCODE not set — emails are disabled.");
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: MAIL_USER, pass: APP_PASS },
    });
  }
  return transporter;
}

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email. Never throws — failures are logged so they don't break the
 * request that triggered them.
 */
export async function sendMail(opts: MailOptions): Promise<{ ok: boolean }> {
  if (!opts.to) return { ok: false };
  const tx = getTransporter();
  if (!tx) return { ok: false };
  try {
    const info = await tx.sendMail({
      from: MAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text || opts.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
    console.log(`[mail] sent "${opts.subject}" to ${opts.to} (id: ${info.messageId})`);
    return { ok: true };
  } catch (err) {
    console.error("[mail] send failed:", err instanceof Error ? err.message : err);
    return { ok: false };
  }
}

const BRAND = "Swarnamaala";
const SHELL = (inner: string) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <div style="background:#b8860b;padding:18px 24px;border-radius:8px 8px 0 0">
      <h1 style="margin:0;color:#fff;font-size:20px">${BRAND}</h1>
    </div>
    <div style="border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 8px 8px">
      ${inner}
      <p style="margin-top:28px;font-size:12px;color:#888">
        This is an automated message from ${BRAND}. Please do not reply to this email.
      </p>
    </div>
  </div>`;

export function welcomeEmail({
  name,
  referralCode,
}: {
  name: string;
  referralCode?: string;
}): { subject: string; html: string } {
  const subject = `Welcome to ${BRAND}!`;
  const html = SHELL(`
    <p>Hi ${name || "there"},</p>
    <p>Thanks for creating an account with <strong>${BRAND}</strong>. We're thrilled to have you!</p>
    <p>You can now turn your favourite photos into beautiful custom magnets.</p>
    ${
      referralCode
        ? `<p>Your personal referral code is <strong>${referralCode}</strong> — share it with friends and earn rewards.</p>`
        : ""
    }
    <p>Happy creating!</p>
  `);
  return { subject, html };
}

export function orderConfirmationEmail({
  name,
  orderId,
  quantity,
  total,
  currency,
  paymentMethod,
}: {
  name: string;
  orderId: string;
  quantity: number;
  total: number;
  currency?: string;
  paymentMethod?: string;
}): { subject: string; html: string } {
  const shortId = String(orderId).slice(-8).toUpperCase();
  const cur = currency === "INR" || !currency ? "\u20B9" : `${currency} `;
  const pay = paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment";
  const subject = `Order confirmed #${shortId}`;
  const html = SHELL(`
    <p>Hi ${name || "there"},</p>
    <p>Thank you for your order! We've received it and will begin processing shortly.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#666">Order ID</td><td style="padding:6px 0;text-align:right"><strong>#${shortId}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#666">Quantity</td><td style="padding:6px 0;text-align:right">${quantity}</td></tr>
      <tr><td style="padding:6px 0;color:#666">Payment</td><td style="padding:6px 0;text-align:right">${pay}</td></tr>
      <tr><td style="padding:6px 0;color:#666">Total</td><td style="padding:6px 0;text-align:right"><strong>${cur}${Number(total).toFixed(2)}</strong></td></tr>
    </table>
    <p>We'll email you again as your order progresses. Thank you for shopping with ${BRAND}!</p>
  `);
  return { subject, html };
}

const esc = (s: string) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Sent when photos arrive for a marketplace (Meesho/Flipkart/…) order. If an
// account was created for the customer, it includes their sign-in details.
export function marketplaceOrderEmail({
  name,
  email,
  platform,
  externalOrderId,
  quantity,
  password,
  siteUrl,
}: {
  name: string;
  email: string;
  platform: string;
  externalOrderId: string;
  quantity: number;
  password?: string;
  siteUrl: string;
}): { subject: string; html: string } {
  const subject = `We've received your photos for ${platform} order ${externalOrderId}`;
  const account = password
    ? `
    <p>We've created a ${BRAND} account for you so you can track this order:</p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0;background:#faf6ef;border-radius:6px">
      <tr><td style="padding:8px 12px;color:#666">Email</td><td style="padding:8px 12px;text-align:right"><strong>${esc(email)}</strong></td></tr>
      <tr><td style="padding:8px 12px;color:#666">Password</td><td style="padding:8px 12px;text-align:right;font-family:monospace;font-size:15px"><strong>${esc(password)}</strong></td></tr>
    </table>
    <p><a href="${siteUrl}/signin" style="color:#8c6a22">Sign in here</a> and change your password after signing in. Keep this email private.</p>`
    : `<p>You can track it anytime by <a href="${siteUrl}/signin" style="color:#8c6a22">signing in</a> with ${esc(email)}.</p>`;
  const html = SHELL(`
    <p>Hi ${esc(name) || "there"},</p>
    <p>Thank you! We've received your photos and will start printing your magnets.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#666">Platform</td><td style="padding:6px 0;text-align:right">${esc(platform)}</td></tr>
      <tr><td style="padding:6px 0;color:#666">Order ID</td><td style="padding:6px 0;text-align:right"><strong>${esc(externalOrderId)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#666">Photos</td><td style="padding:6px 0;text-align:right">${quantity}</td></tr>
    </table>
    ${account}
  `);
  return { subject, html };
}
