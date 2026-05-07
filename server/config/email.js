import nodemailer from 'nodemailer';

// Strip wrapping quotes that users sometimes paste into env vars (e.g. `"Veloura" <addr>`).
// Without this, the From header becomes literal `"Veloura"` <addr> with stray quotes — Gmail rejects it.
function sanitizeFrom(raw) {
  if (!raw) return undefined;
  let v = raw.trim();
  // Outer quotes around the whole value
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  // Quoted display-name pattern like  "Name" <addr>  →  Name <addr>
  v = v.replace(/^"([^"]*)"\s*</, '$1 <').replace(/^'([^']*)'\s*</, '$1 <');
  return v;
}

const SMTP_HOST = process.env.SMTP_HOST?.trim();
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_USER = process.env.SMTP_USER?.trim();
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = sanitizeFrom(process.env.EMAIL_FROM) || SMTP_USER;

const emailEnabled = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

if (!emailEnabled) {
  console.warn('[email] SMTP env vars missing — emails will NOT be sent. Set SMTP_HOST, SMTP_USER, SMTP_PASS.');
}

const transporter = emailEnabled
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // SSL on 465, STARTTLS on 587
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      // Render free tier blocks outbound port 587 — use 465 there.
      // These timeouts surface connection issues quickly instead of hanging.
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    })
  : null;

// Verify SMTP at startup so failures are visible in the deploy logs immediately,
// not only when the first webhook arrives.
if (transporter) {
  transporter.verify((err) => {
    if (err) {
      console.error('[email] SMTP verify FAILED:', err.message);
      console.error('[email] Common causes: wrong app password, 2FA not enabled on Gmail account, EMAIL_FROM contains stray quotes, port blocked.');
    } else {
      console.log(`[email] SMTP ready as ${SMTP_USER} (from: ${EMAIL_FROM}, host: ${SMTP_HOST}:${SMTP_PORT})`);
    }
  });
}

export async function sendMail({ to, subject, html }) {
  if (!transporter) {
    throw new Error('SMTP not configured (missing SMTP_HOST/USER/PASS env vars)');
  }
  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`[email] sent to ${to} — messageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[email] FAILED to send to ${to}:`, err.message);
    if (err.responseCode) console.error(`[email] SMTP response code: ${err.responseCode}`);
    if (err.response) console.error(`[email] SMTP response: ${err.response}`);
    throw err;
  }
}

export default transporter;
