const PADDLE_API_BASE =
  process.env.PADDLE_ENVIRONMENT === 'sandbox'
    ? 'https://sandbox-api.paddle.com'
    : 'https://api.paddle.com';

export async function createPaddleTransaction({ orderId, priceId, customerEmail, templateId }) {
  if (!process.env.PADDLE_API_KEY || process.env.PADDLE_API_KEY === 'replace_me') {
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
