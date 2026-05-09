const PAYPAL_API_BASE =
  process.env.PAYPAL_ENVIRONMENT === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const isConfiguredVal = v => v && !v.startsWith('replace_me') && !v.startsWith('your_');

export function paypalApiConfigured() {
  return isConfiguredVal(process.env.PAYPAL_CLIENT_ID)
    && isConfiguredVal(process.env.PAYPAL_CLIENT_SECRET);
}

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAccessToken() {
  if (!paypalApiConfigured()) throw new Error('PayPal API credentials are not configured');
  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt - now > 60_000) return cachedToken;

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error_description || data.error || `PayPal auth failed (${res.status})`);
  }
  cachedToken = data.access_token;
  cachedTokenExpiresAt = now + (data.expires_in || 0) * 1000;
  return cachedToken;
}

async function paypalFetch(path, init = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const message = data?.message
      || data?.error_description
      || data?.details?.[0]?.description
      || `PayPal API error (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Create a PayPal order (intent: CAPTURE). reference_id and custom_id carry our internal orderId.
export async function createPaypalOrder({ orderId, amount, currency = 'USD' }) {
  return paypalFetch('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: orderId,
        custom_id: orderId,
        description: 'Veloura Digital Wedding Invitation',
        amount: { currency_code: currency, value: amount },
      }],
      application_context: {
        brand_name: 'Veloura',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
      },
    }),
  });
}

export async function capturePaypalOrder(paypalOrderId) {
  return paypalFetch(`/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getPaypalOrder(paypalOrderId) {
  return paypalFetch(`/v2/checkout/orders/${paypalOrderId}`);
}

// Pull the captured payment details (amount, currency, capture id) from a captured PayPal order.
export function extractCaptureDetails(paypalOrder) {
  const pu = paypalOrder?.purchase_units?.[0];
  const capture = pu?.payments?.captures?.[0];
  if (!capture) return null;
  return {
    captureId: capture.id,
    status: capture.status,
    amount: capture.amount?.value,
    currency: capture.amount?.currency_code,
    orderId: pu?.custom_id || pu?.reference_id,
  };
}

// Verify a PayPal webhook by calling PayPal's verify-webhook-signature endpoint.
// In dev (no PAYPAL_WEBHOOK_ID configured), pass through so local testing works.
export async function verifyPaypalWebhook(headers, rawBody) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId || webhookId.startsWith('replace_me')) {
    return process.env.NODE_ENV !== 'production';
  }
  try {
    const result = await paypalFetch('/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      body: JSON.stringify({
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody.toString('utf8')),
      }),
    });
    return result.verification_status === 'SUCCESS';
  } catch {
    return false;
  }
}
