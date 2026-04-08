// Paymob payment gateway configuration
// Docs: https://developers.paymob.com

const PAYMOB_API = 'https://accept.paymob.com/api';

/**
 * Step 1: Get auth token from Paymob
 */
export async function getPaymobToken() {
  const res = await fetch(`${PAYMOB_API}/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
  });
  const data = await res.json();
  if (!data.token) throw new Error('Paymob auth failed');
  return data.token;
}

/**
 * Step 2: Create an order on Paymob
 */
export async function createPaymobOrder(token, { amountCents, merchantOrderId }) {
  const res = await fetch(`${PAYMOB_API}/ecommerce/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: token,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: 'EGP',
      merchant_order_id: merchantOrderId,
      items: [],
    }),
  });
  const data = await res.json();
  if (!data.id) throw new Error('Paymob order creation failed');
  return data;
}

/**
 * Step 3: Generate a payment key (token for the iframe)
 */
export async function getPaymentKey(token, { orderId, amountCents, customer }) {
  const res = await fetch(`${PAYMOB_API}/acceptance/payment_keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: token,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        first_name: customer.firstName || 'N/A',
        last_name: customer.lastName || 'N/A',
        email: customer.email,
        phone_number: customer.phone || 'N/A',
        apartment: 'N/A',
        floor: 'N/A',
        street: 'N/A',
        building: 'N/A',
        shipping_method: 'N/A',
        postal_code: 'N/A',
        city: 'N/A',
        country: 'N/A',
        state: 'N/A',
      },
      currency: 'EGP',
      integration_id: Number(process.env.PAYMOB_INTEGRATION_ID),
    }),
  });
  const data = await res.json();
  if (!data.token) throw new Error('Paymob payment key failed');
  return data.token;
}

/**
 * Verify Paymob callback HMAC
 */
export async function verifyPaymobHmac(data, receivedHmac) {
  const crypto = await import('crypto');
  // Paymob specifies the exact fields and order for HMAC calculation
  const fields = [
    data.amount_cents,
    data.created_at,
    data.currency,
    data.error_occured,
    data.has_parent_transaction,
    data.id,
    data.integration_id,
    data.is_3d_secure,
    data.is_auth,
    data.is_capture,
    data.is_refunded,
    data.is_standalone_payment,
    data.is_voided,
    data.order?.id ?? data.order,
    data.owner,
    data.pending,
    data.source_data?.pan ?? '',
    data.source_data?.sub_type ?? '',
    data.source_data?.type ?? '',
    data.success,
  ];

  const concatenated = fields.join('');
  const hash = crypto.default
    .createHmac('sha512', process.env.PAYMOB_HMAC_SECRET)
    .update(concatenated)
    .digest('hex');

  return hash === receivedHmac;
}
