# Duitku Sandbox checkout

This integration supports Sandbox only. Setting `DUITKU_ENV` to any other value disables payment requests. No real detection job, report, balance credit, or quota fulfillment is triggered by these transactions.

## Configuration

Keep these variables in `apps/web/.env.local` and the deployment's server environment. Never commit their values:

- `DUITKU_ENV=sandbox`
- `DUITKU_MERCHANT_CODE`: Sandbox project code.
- `DUITKU_API_KEY`: Sandbox merchant key. No `NEXT_PUBLIC_` prefix.
- `DUITKU_PUBLIC_URL`: public HTTPS website origin used by callbacks and returns.
- `INSFORGE_API_KEY`: trusted server-only admin key, scoped to the same project as `NEXT_PUBLIC_INSFORGE_URL`.
- Existing public InsForge URL/anon key and auth settings remain required.

Apply `migrations/20261019055102_duitku-sandbox-orders.sql` to an isolated InsForge branch first. Create the private bucket `shield-sandbox-documents` there with the CLI; branch merge includes the bucket definition. Verify the merge preview before applying it to the parent. Test accounts, uploaded documents and transaction rows must stay on the test branch.

## Checkout

1. Sign in and open `/deteksi-ai`.
2. Supply WhatsApp number and a supported document. The browser counts words and uploads directly to private InsForge Storage; document bytes do not pass through Next.js.
3. The server verifies ownership and stored file size, calculates price from the shared tariff/promo rules, and reserves an order. Client-supplied amounts are rejected.
4. `/pembayaran?order=...` loads the owner's stored order. Customers pay through QRIS only; there is no payment-method picker.
5. The server selects an active QRIS channel (SQ, then NQ, then SP) and stores its reference, payment URL and QR payload. It never falls back to VA or card payments. QRIS appears on Gleans; the optional hosted payment link also points to QRIS.
6. After simulating payment in Duitku, the signed callback or the user's manual status check queries Duitku and updates the stored status. Return-page parameters never settle an order.
7. The customer can revisit their transactions in the Sandbox section of `/dashboard/pesanan`.

Callbacks use `POST /api/payments/duitku/callback` with form-encoded data. After the app is deployed, set the project callback URL to the public origin plus this path. A localhost callback is not reachable by Duitku. The Sandbox key must be configured on that deployment first.

## Integrity and access

- User sessions are remotely validated with InsForge. Browser writes require a matching Origin and Host.
- RLS permits customers to read only their own payment rows. Customers cannot insert, update or delete those rows or call payment-maintenance RPCs.
- Private document uploads are owner-scoped. Existing document keys cannot be overwritten or deleted through customer grants.
- Owner/request idempotency and an atomic invoice claim prevent duplicate payments from double clicks or concurrent submissions.
- Reservations are limited to ten per customer per hour. Manual gateway status checks use a database-controlled thirty-second cooldown.
- The callback checks HMAC-SHA256, merchant, nominal and reference; status is independently retrieved from Duitku. Settled payments cannot regress, including in the database.
- Explicit gateway rejections leave the QRIS order retryable. Ambiguous network failures stay in `creating` so another invoice is not issued blindly. Reconcile via the status check; unresolved attempts need operator investigation.
- Some payment methods impose minimum amounts. A gateway rejection leaves the order retryable and asks for a new order without a promotion or support.

## Validation performed

- `pnpm --filter @gleans/web test:payments`: signature, URL allowlist, Sandbox guard, server amount, response validation, reconciliation, storage response compatibility, origin checks and minimum-amount rejection.
- `pnpm --filter @gleans/web test:auth`, typecheck, targeted lint and production build.
- On an isolated backend branch: private file upload/read isolation and overwrite denial, guest and cross-origin rejection, price tampering, request idempotency, cross-account order isolation, blocked direct writes/RPCs/deletes, and paid-state regression guard.
- Real Nobu QRIS invoice creation produced a valid QR payload and was independently checked as pending.
- Real Sandbox methods and invoice APIs; An earlier VA payment simulated through Duitku's official demo validated reconciliation before the checkout was restricted to QRIS. Local callback processing checked against that real Sandbox status, including wrong amount and replay.

Public callback delivery from Duitku still requires deployment and must be retested there. The customer test account required for the merchant review (60 working days) and the public business address are separate outstanding setup items.

## References

- https://docs.duitku.com/api/id/
- https://sandbox.duitku.com/payment/demo/demosuccesstransaction.aspx

### Invoice numbers

New reservations use `GLS-` followed by 12 cryptographically random uppercase hexadecimal characters (for example, `GLS-A7F29B83C1D4`). The database primary key enforces uniqueness; the server retries up to three random candidates on an ID collision only. Existing UUID-based invoice numbers remain valid and are never renamed, so pending QRIS invoices and callbacks continue using their original IDs. Apply `20261020013702_short-invoice-numbers.sql` before running the updated reservation endpoint.
