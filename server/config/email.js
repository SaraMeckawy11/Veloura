import nodemailer from 'nodemailer';

// Strip wrapping quotes that users sometimes paste into env vars (e.g. `"Veloura" <addr>`).
function sanitizeFrom(raw) {
  if (!raw) return undefined;
  let v = raw.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  v = v.replace(/^"([^"]*)"\s*</, '$1 <').replace(/^'([^']*)'\s*</, '$1 <');
  return v;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim();
const SMTP_HOST = process.env.SMTP_HOST?.trim();
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_USER = process.env.SMTP_USER?.trim();
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = sanitizeFrom(process.env.EMAIL_FROM) || SMTP_USER || 'onboarding@resend.dev';

// Provider selection:
//   - If RESEND_API_KEY is set, use Resend's HTTPS API (works on Render's free tier).
//   - Otherwise fall back to nodemailer SMTP (works locally; blocked on Render free tier).
const useResend = !!RESEND_API_KEY;
const smtpEnabled = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;

if (useResend) {
  console.log(`[email] Provider: Resend (HTTPS) — from: ${EMAIL_FROM}`);
} else if (smtpEnabled) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
  transporter.verify((err) => {
    if (err) {
      console.error('[email] SMTP verify FAILED:', err.message);
      console.error('[email] If hosting on Render free/starter tier, SMTP is blocked. Use Resend instead — set RESEND_API_KEY.');
    } else {
      console.log(`[email] SMTP ready as ${SMTP_USER} (from: ${EMAIL_FROM}, host: ${SMTP_HOST}:${SMTP_PORT})`);
    }
  });
} else {
  console.warn('[email] No email provider configured — emails will NOT be sent. Set RESEND_API_KEY (recommended) or SMTP_HOST/USER/PASS.');
}

async function sendViaResend({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(`Resend API error: ${message}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export async function sendMail({ to, subject, html }) {
  if (useResend) {
    try {
      const info = await sendViaResend({ to, subject, html });
      console.log(`[email] sent via Resend to ${to} — id: ${info.id}`);
      return info;
    } catch (err) {
      console.error(`[email] FAILED via Resend to ${to}:`, err.message);
      if (err.body) console.error('[email] Resend response:', JSON.stringify(err.body));
      throw err;
    }
  }

  if (!transporter) {
    throw new Error('Email not configured (set RESEND_API_KEY for production, or SMTP_HOST/USER/PASS for local dev)');
  }
  try {
    const info = await transporter.sendMail({ from: EMAIL_FROM, to, subject, html });
    console.log(`[email] sent via SMTP to ${to} — messageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[email] FAILED via SMTP to ${to}:`, err.message);
    if (err.responseCode) console.error(`[email] SMTP response code: ${err.responseCode}`);
    if (err.response) console.error(`[email] SMTP response: ${err.response}`);
    throw err;
  }
}

export default transporter;
