# Payments API

This app exposes a thin REST API around the local Paynow Express SDK in `payments.paynow_plus.paynow_express`.

Local base URL:

```text
http://localhost:8000/api/payments/
```

Authenticated endpoints require JWT bearer auth:

```text
Authorization: Bearer <access-token>
```

## Configuration

Set these environment variables before using the API:

```bash
PAYNOW_INTEGRATION_ID=your-paynow-integration-id
PAYNOW_INTEGRATION_KEY=your-paynow-integration-key
SABHUKU_PAYNOW_RETURN_URL=http://localhost:8000/api/payments/return/
SABHUKU_PAYNOW_RESULT_URL=http://localhost:8000/api/payments/result/
```

`PAYNOW_INTEGRATION_ID` and `PAYNOW_INTEGRATION_KEY` are required. The return and result URLs have local defaults, but should be set explicitly in production.

In Paynow test mode, use the merchant account email as `authemail`. If `authemail` is omitted, the API uses the authenticated user's email.

## Payment Methods

Supported `method` values:

```text
ecocash
onemoney
innbucks
omari
vmc
zimswitch
```

Mobile money methods are `ecocash`, `onemoney`, `innbucks`, and `omari`.

Card/token methods are `vmc` and `zimswitch`.

## Initiate Payment

```text
POST /api/payments/initiate/
```

Auth: required

Starts a Paynow Express payment.

### Mobile Money Request

Required fields:

- `method`
- `reference`
- `amount`
- `phone`
- `authemail`, unless the authenticated user has an email

Example:

```json
{
  "method": "innbucks",
  "reference": "INV-1001",
  "amount": "12.50",
  "phone": "0771111111",
  "additionalinfo": "Sabhuku AI credits"
}
```

Optional fields:

- `additionalinfo`
- `authphone`
- `authname`
- `merchanttrace`

### Card Request

Required fields:

- `method`: `vmc` or `zimswitch`
- `reference`
- `amount`
- `token`
- `merchanttrace`
- `authemail`, unless the authenticated user has an email

Example:

```json
{
  "method": "vmc",
  "reference": "INV-1002",
  "amount": "24.00",
  "token": "{11111111-1111-1111-1111-111111111111}",
  "merchanttrace": "inv-1002-card",
  "additionalinfo": "Sabhuku AI Pro"
}
```

`merchanttrace` must be unique per card request and no longer than 32 characters. Use it to recover from request timeouts with the trace endpoint.

### Initiate Response

Example:

```json
{
  "status": "Ok",
  "ok": true,
  "hash_valid": true,
  "poll_url": "https://www.paynow.co.zw/Interface/CheckPayment/?guid=...",
  "browser_url": null,
  "authorization_code": "ABC123",
  "authorization_expires": "10-Jun-2026 14:00",
  "innbucks_deep_link": "com.innbucks.customer://purchase?paymentToken=ABC123",
  "otp_reference": null,
  "remote_otp_url": null,
  "fields": {
    "status": "Ok",
    "pollurl": "https://www.paynow.co.zw/Interface/CheckPayment/?guid=...",
    "authorizationcode": "ABC123",
    "hash": "..."
  }
}
```

Important response fields:

- `status`: Paynow status string.
- `ok`: true when `status` is `Ok`.
- `hash_valid`: whether the Paynow response hash passed validation.
- `poll_url`: store this client-side or server-side so you can check final status later.
- `innbucks_deep_link`: use this for InnBucks app redirects when Paynow returns an authorization code.
- `remote_otp_url`: use this for O'mari OTP completion.
- `fields`: the raw parsed Paynow fields, lowercased.

## Poll Payment Status

```text
POST /api/payments/poll/
```

Auth: required

Requests the latest Paynow status using a `poll_url` returned by initiate.

Request:

```json
{
  "poll_url": "https://www.paynow.co.zw/Interface/CheckPayment/?guid=..."
}
```

Response shape is the same as initiate.

Common final statuses include `Paid`, `Cancelled`, `Failed`, and `Awaiting Delivery`, depending on Paynow's response.

## Trace Card Transaction

```text
POST /api/payments/trace/
```

Auth: required

Looks up a card/token transaction using `merchanttrace`. This is useful when the original `initiate` request times out and you need to avoid duplicate debits.

Request:

```json
{
  "merchanttrace": "inv-1002-card"
}
```

Response shape is the same as initiate.

## Complete O'mari OTP

```text
POST /api/payments/omari/otp/
```

Auth: required

Completes an O'mari payment after the user provides an OTP.

Request:

```json
{
  "remote_otp_url": "https://www.paynow.co.zw/...",
  "otp": "123456"
}
```

Response shape is the same as initiate.

## Result Callback

```text
POST /api/payments/result/
```

Auth: not required

Paynow posts asynchronous payment updates to this URL. The endpoint parses Paynow's form-encoded message and validates the hash.

Response:

```json
{
  "hash_valid": true,
  "fields": {
    "reference": "INV-1001",
    "paynowreference": "12345",
    "amount": "12.50",
    "status": "Paid",
    "hash": "..."
  }
}
```

If the hash is invalid, the endpoint returns HTTP `400`.

Current behavior: the callback validates and returns the parsed fields. It does not persist payment status yet because the payments app has no transaction model.

## Return URL

```text
GET /api/payments/return/
```

Auth: not required

This is the browser return endpoint configured with Paynow. It currently returns a simple JSON confirmation and query parameters.

## Paynow Test Mode Values

Use these in Paynow test mode.

Mobile money phone numbers:

```text
Success              0771111111
Delayed success      0772222222
User cancelled       0773333333
Insufficient balance 0774444444
```

Visa/Mastercard `vmc` tokens:

```text
Success              {11111111-1111-1111-1111-111111111111}
Pending              {22222222-2222-2222-2222-222222222222}
Cancelled            {33333333-3333-3333-3333-333333333333}
Insufficient balance {44444444-4444-4444-4444-444444444444}
```

ZimSwitch tokens:

```text
Success              11111111111111111111111111111111
Pending              22222222222222222222222222222222
Cancelled            33333333333333333333333333333333
Insufficient balance 44444444444444444444444444444444
```

The SDK exposes these constants:

```python
from payments.paynow_plus.paynow_express import (
    PaynowTestMobileNumber,
    PaynowTestVisaMastercardToken,
    PaynowTestZimswitchToken,
)
```

## Frontend Flow

1. The frontend calls `POST /api/payments/initiate/`.
2. Store `poll_url` from the response.
3. If `innbucks_deep_link` exists, open it for InnBucks authorization.
4. If `remote_otp_url` exists, collect O'mari OTP and call `POST /api/payments/omari/otp/`.
5. Poll with `POST /api/payments/poll/` until Paynow returns a final status.
6. Paynow may also call `POST /api/payments/result/` asynchronously.

## Validation Rules

- Mobile money methods require `phone`.
- Card methods require `token` and `merchanttrace`.
- `merchanttrace` is limited to 32 characters.
- `amount` is serialized to two decimal places before Paynow signing.
- Paynow responses with a `hash` are rejected if hash validation fails.

## Running Tests

From `backend/`:

```bash
venv/bin/python manage.py test payments
```

Current payment tests cover hashing, hash validation, test-mode values, SDK request payloads, polling, trace lookup, serializer validation, API initiation, and result callback validation.
