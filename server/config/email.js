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

// Parse "Display Name <addr@example.com>" into { name, email }.
function parseFromAddress(raw) {
  if (!raw) return null;
  const v = sanitizeFrom(raw);
  const match = v.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: undefined, email: v.trim() };
}

const BREVO_API_KEY = process.env.BREVO_API_KEY?.trim();
const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim();
const SMTP_HOST = process.env.SMTP_HOST?.trim();
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_USER = process.env.SMTP_USER?.trim();
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = sanitizeFrom(process.env.EMAIL_FROM) || SMTP_USER;
const FROM_PARSED = parseFromAddress(EMAIL_FROM);

// Provider selection (first match wins):
//   1. BREVO_API_KEY  → Brevo HTTPS API
//   2. RESEND_API_KEY → Resend HTTPS API
//   3. SMTP_*         → nodemailer SMTP (local dev; blocked on Render free tier)
const provider = BREVO_API_KEY ? 'brevo'
  : RESEND_API_KEY ? 'resend'
  : (SMTP_HOST && SMTP_USER && SMTP_PASS) ? 'smtp'
  : null;

let transporter = null;

if (provider === 'brevo') {
  console.log(`[email] Provider: Brevo (HTTPS) — from: ${EMAIL_FROM}`);
} else if (provider === 'resend') {
  console.log(`[email] Provider: Resend (HTTPS) — from: ${EMAIL_FROM}`);
} else if (provider === 'smtp') {
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
      console.error('[email] If hosting on Render free/starter tier, SMTP is blocked. Use BREVO_API_KEY or RESEND_API_KEY.');
    } else {
      console.log(`[email] SMTP ready as ${SMTP_USER} (from: ${EMAIL_FROM}, host: ${SMTP_HOST}:${SMTP_PORT})`);
    }
  });
} else {
  console.warn('[email] No email provider configured — emails will NOT be sent. Set BREVO_API_KEY or RESEND_API_KEY (recommended) or SMTP_HOST/USER/PASS.');
}

async function sendViaBrevo({ to, subject, html }) {
  if (!FROM_PARSED?.email) {
    throw new Error('EMAIL_FROM must be set to a valid address (e.g. "Veloura <veloura.invitations@gmail.com>") for Brevo.');
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: FROM_PARSED.name || 'Veloura', email: FROM_PARSED.email },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(`Brevo API error: ${message}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
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
  if (provider === 'brevo') {
    try {
      const info = await sendViaBrevo({ to, subject, html });
      console.log(`[email] sent via Brevo to ${to} — id: ${info.messageId || 'ok'}`);
      return info;
    } catch (err) {
      console.error(`[email] FAILED via Brevo to ${to}:`, err.message);
      if (err.body) console.error('[email] Brevo response:', JSON.stringify(err.body));
      throw err;
    }
  }

  if (provider === 'resend') {
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

  if (provider === 'smtp' && transporter) {
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

  throw new Error('Email not configured (set BREVO_API_KEY for production, or SMTP_* for local dev)');
}

export default transporter;
