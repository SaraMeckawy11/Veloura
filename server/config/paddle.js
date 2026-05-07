const PADDLE_API_BASE =
  process.env.PADDLE_ENVIRONMENT === 'sandbox'
    ? 'https://sandbox-api.paddle.com'
    : 'https://api.paddle.com';

export function paddleApiConfigured() {
  return !!process.env.PADDLE_API_KEY
    && !process.env.PADDLE_API_KEY.startsWith('replace_me')
    && !process.env.PADDLE_API_KEY.startsWith('your_');
}

async function paddleFetch(path) {
  if (!paddleApiConfigured()) throw new Error('Paddle API key is not configured');
  const res = await fetch(`${PADDLE_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.detail || data?.error?.message || data?.message || `Paddle API error (${res.status})`;
    throw new Error(message);
  }
  return data.data;
}

// Look up the most recent paid transaction for a given orderId (stored in custom_data).
// Returns the transaction object or null if no paid one is found.
export async function findPaddleTransactionForOrder(orderId) {
  // Paddle's /transactions endpoint supports filtering by custom_data via list params.
  // We list recent transactions and filter client-side by custom_data.orderId for reliability.
  const transactions = await paddleFetch('/transactions?status=completed,paid&order_by=created_at[DESC]&per_page=50');
  if (!Array.isArray(transactions)) return null;
  return transactions.find(tx => tx?.custom_data?.orderId === orderId) || null;
}

export async function createPaddleTransaction({ orderId, priceId, customerEmail, templateId }) {
  if (!paddleApiConfigured()) {
    throw new Error('Paddle API key is not configured');
  }

  const res = await fetch(`${PADDLE_API_BASE}/transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          price_id: priceId,
          quantity: 1,
        },
      ],
      custom_data: {
        orderId,
        customerEmail,
        templateId,
        platform: 'veloura',
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.detail || data?.error?.message || data?.message || 'Paddle transaction creation failed';
    throw new Error(message);
  }

  return data.data;
}
