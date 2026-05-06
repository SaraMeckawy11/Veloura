# Veloura Paddle Setup

Use Paddle Sandbox while building. Switch to Live only after the Veloura domain is deployed, verified, and approved.

## Sandbox Setup

Use the sandbox dashboard, not the live dashboard:

```text
https://sandbox-vendors.paddle.com
```

Sandbox credentials are different from live credentials. Sandbox API keys contain `_sdbx`, and sandbox client-side tokens start with `test_`.

## Paddle Catalog

1. In Paddle, create a product named `Veloura Digital Wedding Invitation`.
2. Set the product description to `Personalized digital wedding invitation with animated reveal, RSVP, guest dashboard, music, maps, and hosted invitation link.`
3. Choose the closest tax category for your business model. For a done-for-you customized invitation service, start with a services category such as `professional-services` or the category Paddle recommends during review.
4. Create a one-time price:
   - Price name: `All-Inclusive Package`
   - Amount: `89.00`
   - Currency: `USD`
5. Copy the Paddle price ID. It starts with `pri_`.

## Website URLs For Paddle Verification

Replace `veloura.co` with your real launched domain:

- Web domain: `https://veloura.co`
- Pricing page: `https://veloura.co/pricing`
- Terms of service: `https://veloura.co/terms`
- Privacy policy: `https://veloura.co/privacy`
- Refund policy: `https://veloura.co/refund-policy`

## Environment Variables

In `server/.env`, set the sandbox values:

```env
PRICE_USD=89.00
PADDLE_ENVIRONMENT=sandbox
PADDLE_API_KEY=replace_me_sandbox_api_key
PADDLE_CLIENT_TOKEN=replace_me_sandbox_client_side_token
PADDLE_PRICE_ID=replace_me_sandbox_price_id
PADDLE_WEBHOOK_SECRET=replace_me_sandbox_webhook_secret
```

For live launch, replace the sandbox values with live values and set:

```env
PADDLE_ENVIRONMENT=production
```

Do not put your Paddle login password in the codebase. Only use Paddle-generated API keys, client-side tokens, price IDs, and webhook secrets.

## Webhook

Create a Paddle notification destination:

```text
https://veloura.co/api/webhooks/paddle
```

Subscribe to:

- `transaction.completed`
- `transaction.paid`
- `transaction.payment_failed`
- `transaction.canceled`

For local webhook testing, use a tunnel such as ngrok or Cloudflare Tunnel and set the notification destination to:

```text
https://your-tunnel-url/api/webhooks/paddle
```

The webhook activates the Veloura order and sends the invitation email after Paddle confirms payment.

## Sandbox Test Card

Use a Paddle sandbox test card, for example:

```text
Card number: 4242 4242 4242 4242
Expiry: any future date
CVC: any 3 digits
Name: any name
```
