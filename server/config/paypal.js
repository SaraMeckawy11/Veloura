// PayPal REST API integration
// Docs: https://developer.paypal.com/docs/api/orders/v2/

const BASE =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

/**
 * Get an OAuth2 access token from PayPal
 */
async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!data.access_token) throw new Error('PayPal auth failed');
  return data.access_token;
}

/**
 * Create a PayPal order (checkout session)
 * Returns the approval URL to redirect the customer to
 */
export async function createPayPalOrder({ amountUSD, description, orderId }) {
  const token = await getAccessToken();

  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderId,
          description,
          amount: {
            currency_code: 'USD',
            value: amountUSD,
          },
        },
      ],
      application_context: {
        brand_name: 'Eternally',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.SERVER_URL || `http://localhost:${process.env.PORT || 4000}`}/api/webhooks/paypal/success`,
        cancel_url: `${process.env.CLIENT_URL}/order/cancel`,
      },
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error_description || 'PayPal order creation failed');

  const approveLink = data.links?.find((l) => l.rel === 'approve');
  if (!approveLink) throw new Error('No PayPal approval URL returned');

  return {
    paypalOrderId: data.id,
    approvalUrl: approveLink.href,
  };
}

/**
 * Capture payment after customer approves
 */
export async function capturePayPalOrder(paypalOrderId) {
  const token = await getAccessToken();

  const res = await fetch(`${BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();
  return data;
}

/**
 * Verify a webhook signature from PayPal
 */
export async function verifyWebhookSignature({ headers, body, webhookId }) {
  const token = await getAccessToken();

  const res = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: body,
    }),
  });

  const data = await res.json();
  return data.verification_status === 'SUCCESS';
}
