import { createHash, randomInt } from "crypto";
import nodemailer from "nodemailer";
import { Resend } from "resend";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function gmailConfigured() {
  return Boolean(
    process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim()
  );
}

function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** True when either Gmail SMTP or Resend can send OTP mail. */
export function otpConfigured() {
  return gmailConfigured() || resendConfigured();
}

export function hashOtp(code: string, email: string) {
  return createHash("sha256")
    .update(`${email.toLowerCase()}:${code}`)
    .digest("hex");
}

export function generateOtpCode() {
  return String(randomInt(100000, 1000000));
}

export function otpExpiryDate() {
  return new Date(Date.now() + OTP_TTL_MS);
}

export { MAX_ATTEMPTS, OTP_TTL_MS };

function otpEmailContent(opts: { name: string; code: string }) {
  const subject = `${opts.code} is your VeoLMS verification code`;
  const html = `
      <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
        <h2 style="margin:0 0 12px">Verify your email</h2>
        <p style="margin:0 0 12px">Hi ${escapeHtml(opts.name)},</p>
        <p style="margin:0 0 12px">Use this code to finish creating your VeoLMS account:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:16px 0">${opts.code}</p>
        <p style="margin:0 0 8px;color:#555">This code expires in 10 minutes.</p>
        <p style="margin:0;color:#555">If you didn’t request this, you can ignore this email.</p>
      </div>
    `;
  const text = `Hi ${opts.name},\n\nYour VeoLMS verification code is ${opts.code}. It expires in 10 minutes.\n`;
  return { subject, html, text };
}

async function sendViaGmail(opts: {
  email: string;
  name: string;
  code: string;
}) {
  const user = process.env.GMAIL_USER!.trim();
  // App passwords are often copied with spaces — strip them.
  const pass = process.env.GMAIL_APP_PASSWORD!.replace(/\s+/g, "");
  const fromName = process.env.GMAIL_FROM_NAME?.trim() || "VeoLMS";
  const { subject, html, text } = otpEmailContent(opts);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"${fromName}" <${user}>`,
    to: opts.email,
    subject,
    html,
    text,
  });
}

async function sendViaResend(opts: {
  email: string;
  name: string;
  code: string;
}) {
  const apiKey = process.env.RESEND_API_KEY!.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "VeoLMS <onboarding@resend.dev>";
  const resend = new Resend(apiKey);
  const { subject, html, text } = otpEmailContent(opts);

  const { error } = await resend.emails.send({
    from,
    to: opts.email,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message || "Failed to send verification email");
  }
}

/**
 * Prefer Gmail SMTP when configured (can send to any recipient without a domain).
 * Fall back to Resend (domain required for arbitrary recipients).
 */
export async function sendSignupOtpEmail(opts: {
  email: string;
  name: string;
  code: string;
}) {
  if (gmailConfigured()) {
    try {
      await sendViaGmail(opts);
      return;
    } catch (e) {
      // If Resend is also available, try it; otherwise surface Gmail error.
      if (!resendConfigured()) {
        const message =
          e instanceof Error ? e.message : "Gmail SMTP send failed";
        throw new Error(
          `${message}. Check GMAIL_USER / GMAIL_APP_PASSWORD (Google App Password, 2FA on).`
        );
      }
    }
  }

  if (resendConfigured()) {
    await sendViaResend(opts);
    return;
  }

  throw new Error(
    "Email OTP is not configured. Set GMAIL_USER + GMAIL_APP_PASSWORD, or RESEND_API_KEY."
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
