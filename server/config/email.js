const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function trimWrappingQuotes(value) {
  if (!value) return value;
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function parseEmailAddress(value) {
  const cleaned = trimWrappingQuotes(value);
  if (!cleaned) return null;

  const match = cleaned.match(/^(?:"?([^"<]*)"?\s*)?<([^<>@\s]+@[^<>@\s]+)>$/);
  if (match) {
    return {
      name: trimWrappingQuotes(match[1]) || undefined,
      email: match[2].trim(),
    };
  }

  return { email: cleaned };
}

function getSender() {
  const senderEmail = trimWrappingQuotes(process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM_ADDRESS);
  const senderName = trimWrappingQuotes(process.env.BREVO_SENDER_NAME || process.env.EMAIL_FROM_NAME) || 'Veloura';

  if (senderEmail) {
    return { name: senderName, email: senderEmail };
  }

  const legacySender = parseEmailAddress(process.env.EMAIL_FROM);
  if (legacySender?.email) {
    return { name: legacySender.name || senderName, email: legacySender.email };
  }

  throw new Error('Missing Brevo sender email. Set BREVO_SENDER_EMAIL to a verified Brevo sender.');
}

function normalizeRecipients(to) {
  const recipients = Array.isArray(to) ? to : [to];

  return recipients.map(recipient => {
    if (typeof recipient === 'string') return parseEmailAddress(recipient);
    if (recipient?.email) {
      return {
        email: trimWrappingQuotes(recipient.email),
        name: trimWrappingQuotes(recipient.name) || undefined,
      };
    }
    return null;
  }).filter(recipient => recipient?.email);
}

async function parseBrevoResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function sendMail({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Missing BREVO_API_KEY. Add your Brevo transactional email API key.');
  }

  const recipients = normalizeRecipients(to);
  if (recipients.length === 0) {
    throw new Error('Email requires at least one recipient.');
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: getSender(),
      to: recipients,
      subject,
      htmlContent: html,
    }),
  });

  const body = await parseBrevoResponse(response);

  if (!response.ok) {
    const message = body.message || body.error || `Brevo API error ${response.status}`;
    console.error('[email] Brevo response:', JSON.stringify(body));
    throw new Error(`Brevo API error: ${message}`);
  }

  console.log(`[email] sent via Brevo to ${recipients.map(recipient => recipient.email).join(', ')}`);
  return body;
}

export default { sendMail };
