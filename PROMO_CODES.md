# Promo code administration

Promo discounts and usage limits are enforced by the server. Set a long random
`PROMO_ADMIN_KEY` in `server/.env` (and in the production server environment)
before using the protected administration endpoints.

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
  maxUses = 1
  active = $true
  expiresAt = $null
} | ConvertTo-Json
Invoke-RestMethod -Method Put -Uri 'https://your-api.example.com/api/promos/admin/Nour' -Headers $headers -Body $body
```

The built-in `Nour` code is created automatically with a 100% discount and a
maximum of one successful use. Updating it through the endpoint does not reset
its redemption history.
