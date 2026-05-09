# Veloura PayPal Setup

Use the PayPal Sandbox while building. Switch to Live only after the Veloura domain is deployed and you have a Live business account ready.

## Sandbox vs Live

PayPal has two completely separate environments. Sandbox credentials cannot be used in Live and vice versa.

- Sandbox dashboard: <https://developer.paypal.com/dashboard/applications/sandbox>
- Live dashboard: <https://developer.paypal.com/dashboard/applications/live>
- Sandbox test buyer/business accounts: <https://developer.paypal.com/dashboard/accounts>

In each dashboard, create an app (or open the default one) and grab:

- **Client ID** (safe to ship to the browser — used by the JS SDK)
- **Secret** (server-only — never commit, never paste in chat)

## Environment Variables

In `server/.env`, set the sandbox values:

```env
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_CLIENT_ID=replace_me_paypal_client_id
PAYPAL_CLIENT_SECRET=replace_me_paypal_client_secret
PAYPAL_WEBHOOK_ID=replace_me_paypal_webhook_id

PRICE_USD=89.00
PRICE_CURRENCY=USD
```

For the Live launch, replace each value with the corresponding Live credential and set:

```env
PAYPAL_ENVIRONMENT=live
```

The server picks the correct PayPal API base automatically (`api-m.sandbox.paypal.com` for sandbox, `api-m.paypal.com` for live).

Do not put your PayPal account login password in the codebase. Only use PayPal-generated Client IDs, Secrets, and Webhook IDs.

## Webhook

In the PayPal Developer Dashboard → your app → **Sandbox Webhooks** (or **Live Webhooks**), add a webhook with this URL:

```text
https://veloura.co/api/webhooks/paypal
```

Subscribe at minimum to:

- `CHECKOUT.ORDER.APPROVED`
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`
- `PAYMENT.CAPTURE.REFUNDED`
- `PAYMENT.CAPTURE.REVERSED`
- `CHECKOUT.ORDER.VOIDED`

After saving, copy the **Webhook ID** PayPal generates and put it in `PAYPAL_WEBHOOK_ID`. The server uses PayPal's `verify-webhook-signature` API to validate every event using this id.

For local webhook testing, use a tunnel such as ngrok or Cloudflare Tunnel and register the tunnel URL as the webhook destination:

```text
https://your-tunnel-url/api/webhooks/paypal
```

The webhook activates the Veloura order and sends the invitation email after PayPal confirms the capture.

## Testing in Sandbox

The end-to-end flow you should test:

1. Open `/order` and complete steps 1 and 2.
2. On step 3, click **Continue to Payment**. The PayPal Buttons render in the inline frame.
3. Click the yellow PayPal button. A popup opens — log in with a sandbox **personal** test account (created at the sandbox accounts page above).
4. Approve the payment. The popup closes, the front-end calls `POST /api/orders/capture/:orderId`, the server captures the PayPal order, activates the Veloura order, and you are redirected to the success page.
5. The webhook also fires `PAYMENT.CAPTURE.COMPLETED` — this is idempotent; the order is already paid by the time it arrives.

### Sandbox test cards

PayPal generates test cards on demand at <https://developer.paypal.com/api/rest/sandbox/card-testing/>. Common scenarios:

- **Successful capture**: any generated approved card, any future expiry, any 3-digit CVV.
- **3-D Secure challenge**: use the generator's "challenge required" option.
- **Declined card**: use the generator's "decline" option.
- **Insufficient funds**: log in with a sandbox personal account whose PayPal balance is set to 0.

Visa/Mastercard test card numbers from other providers (e.g. Stripe's `4242 4242 4242 4242`) are **not** valid in the PayPal sandbox.

## Going Live — Checklist

1. PayPal business account is verified (email, bank, identity).
2. Live app created and Live Client ID + Secret pasted into `server/.env`.
3. `PAYPAL_ENVIRONMENT=live` set in production env.
4. Live webhook created at `https://veloura.co/api/webhooks/paypal` and Live `PAYPAL_WEBHOOK_ID` pasted.
5. One real low-value transaction (e.g. $1) completed end-to-end before announcing.
6. Refund tested from the PayPal merchant dashboard — confirm the order shows as `refunded` in MongoDB.
