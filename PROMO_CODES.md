# Promo code administration

Promo discounts and usage limits are enforced by the server. Set a long random
`PROMO_ADMIN_KEY` in `server/.env` (and in the production server environment)
before using the protected administration endpoints.

The same controls are available in the browser at `/admin/promos`. Enter the
server's `PROMO_ADMIN_KEY` there; the key is kept only for the current browser
session and is sent to the protected API in the `x-promo-admin-key` header.

## List codes and remaining uses

```powershell
$headers = @{ 'x-promo-admin-key' = $env:VELOURA_PROMO_ADMIN_KEY }
Invoke-RestMethod -Method Get -Uri 'https://your-api.example.com/api/promos/admin' -Headers $headers
```

## Create or update a code

`maxUses` controls the total number of successful redemptions. Set `active` to
`false` to stop a code immediately. `expiresAt` may be `null` or an ISO date.

```powershell
$headers = @{
  'x-promo-admin-key' = $env:VELOURA_PROMO_ADMIN_KEY
  'Content-Type' = 'application/json'
}
$body = @{
  displayCode = 'Nour'
  discountPercent = 100
  maxUses = 2
  active = $true
  expiresAt = $null
} | ConvertTo-Json
Invoke-RestMethod -Method Put -Uri 'https://your-api.example.com/api/promos/admin/Nour' -Headers $headers -Body $body
```

The built-in `Nour` code is created automatically with a 100% discount and a
total allowance of two successful uses. This preserves the first accidental
redemption and leaves one more use available. Updating a code's limit does not
erase its redemption history.

Each redemption is stored on the promo-code document against its order as one
of three states: `reserved` while checkout is in progress, `redeemed` after the
order succeeds, or `released` after cancellation/expiry. The admin page shows
used, reserved, and remaining counts. `maxUses` is the lifetime successful-use
limit; increase it to grant additional uses, or disable the code to stop it.
