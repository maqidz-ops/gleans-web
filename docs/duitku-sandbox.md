# Duitku Sandbox checkout

Sandbox only: any other `DUITKU_ENV` disables payment requests. The app supports account and guest checkout, public order lookup, and private downloads of reports uploaded by the configured admin. Detection is not automated; payment alone never creates a report, credits a balance, or adds quota.

## Configuration

Keep values in `apps/web/.env.local` and server deployment settings, never Git:

- `DUITKU_ENV=sandbox`
- `DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY` (server only)
- `DUITKU_PUBLIC_URL`: public HTTPS callback/return origin
- `INSFORGE_API_KEY`: existing server-only project admin key
- Existing InsForge public URL/anon key and configured Gleans admin ID/email

Apply migrations in order, first on an isolated backend branch:

1. `20261019055102_duitku-sandbox-orders.sql`
2. `20261020013702_short-invoice-numbers.sql`
3. `20261020025949_public-order-lookup-limits.sql`
4. `20261020032838_guest-checkout-reports.sql`
5. `20261020043035_guest-upload-quotas.sql`

The private bucket `shield-sandbox-documents` must exist. Never make it public. Review branch merge previews; user rows and uploaded QA files must not be migrated. Public callback delivery still requires deployment and merchant callback configuration. This branch has not been deployed or merged to Git main automatically.

## Guest flow

1. Open `/deteksi-ai` without an account. Enter WhatsApp, customer email (required by Duitku), optional promo, and a supported file up to 25MB / 25,000 words.
2. `/api/payments/uploads` issues a presigned POST restricted to a server-generated staging key and declared maximum size. The browser uploads directly to Storage without receiving an admin key. Confirmation validates actual size/header and seals a snapshot at a different private key; reusing a staging URL cannot alter the order document.
3. A short-lived, private upload ticket binds the file to an httpOnly guest cookie. `reserve_guest_order` consumes it atomically, applies server pricing, and binds the order to its guest hash and optional authenticated owner. Reusing a consumed ticket is rejected; request retries are idempotent.
4. New invoice numbers use `GLS-` plus 12 cryptographically random uppercase hex characters. The primary key enforces uniqueness and the server retries three ID candidates on primary-key collisions only. Legacy UUID invoices are unchanged.
5. QRIS only: active channel priority SQ, NQ, SP. No VA/card fallback. The page supports pay and status checks without login. Gateway callbacks and manual checks independently query Duitku; return URL fields never prove payment. Explicit invoice rejection allows retry; ambiguous failures remain `creating` to prevent duplicates.
6. A 256-bit per-order access code is derived from the guest secret and stored only as a hash. The originating browser automatically has download access. “Salin tautan akses” gives a private link with the code in its URL fragment, never the query string. The checkout exchanges that code for an httpOnly, order-specific cookie and removes the fragment. A customer on another device can use that link/code without creating an account.

## Lookup and downloads

`/cek-pesanan` accepts exact short/legacy invoice numbers or Indonesian WhatsApp formats `08…`, `628…`, `+628…`. Both signed-in and guest visitors see allowlisted order metadata: full invoice, document name/size, amount, date, payment and processing state, with payment/detail actions. This is the intended public metadata surface; a phone number is **not** proof of document ownership. Contacts, storage keys/URLs, gateway references, guest/access hashes and download codes are never returned by lookup. Up to 30 newest matches are returned with no-store headers. Detailed payment pages are also public, but never grant document access from an invoice or phone number alone.

Report downloads require either the configured account owner or a valid guest access capability, plus paid status, completed report metadata, and an unexpired 24-hour window. The server mints an object-specific signed URL for at most 60 seconds, capped by the remaining window. Missing, wrong, unpaid or expired access cannot download a file. Expiry denies customer downloads; it is not automatic physical deletion from Storage. Signed-in owners retain access to legacy orders.

## Admin fulfillment

The existing `/admin/pesanan` now includes stored QRIS orders alongside the existing demo section. Only the configured admin identity (ID **and** email) can list these operational orders, download source documents, start processing paid orders, or upload actual PDF results. The report uploader uses the same sealed-upload mechanism. Publishing sets completion/24-hour expiry; database constraints reject unpaid publication and the trigger prevents extending or replacing a published report. No new admin users, role grants, or weaker auth settings are required by this feature.

## Limits and integrity

- Existing owner-only RLS on `duitku_orders` remains. Guest rows are not directly readable by anonymous clients. Upload tickets, hashes and maintenance RPCs are server-only; ordinary roles have no access.
- Same-origin checks protect browser mutations. Valid public requests are limited through a shared database counter to 12/source/minute per operation scope and 1,200 requests/minute globally. Vercel IP headers are trusted only on Vercel; other environments share a fallback bucket. Addresses are HMAC hashed, never stored raw. See [Vercel request headers](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for).
- Upload ticket claims also reserve byte quotas atomically: 256MiB/source/hour and 4GiB/hour globally, including unconsumed tickets. Redeeming a signed upload never bypasses its declared size cap.
- Reservations are limited to ten/owner-or-guest/hour. Gateway status checks claim a 30-second slot atomically. Paid states, identity/price, and published report lifetimes are immutable.
- Source files briefly pass through the confirmation function for the sealed copy, after direct browser upload. No document bytes are posted to a Next.js request body. Confirmation is capped at 60 seconds and 25MB/file; staged objects are removed after sealing.
- Unused ticket/Storage lifecycle cleanup is not automated. Set an operator retention policy before a live rollout. Production payments remain disabled.

## Validation

Payment/auth/admin tests, typecheck, targeted lint and production build are run. Isolated backend tests verify guest idempotency, consumed-ticket rejection, immutable identity, no unpaid report publication, immutable report expiry, private table/RPC privileges and atomic upload byte caps.

A separate local QA server with the isolated backend tested: no-login presigned upload and sealing, public phone/invoice lookup, real Nobu QRIS creation/pending reconciliation, admin API denial, signed report bytes, cross-browser access-code recovery, direct backend denial, and staging-URL replay isolation. Report delivery used an explicitly synthetic settled row and synthetic PDF **only on the QA branch**; it is not evidence of a settled QRIS payment or real detection result. No QA admin account was created.

## Merchant review

The customer reviewer account has already been provisioned; its credentials remain in ignored local files and must stay private. Maintain it for at least 60 working days. Public business support address and public callback/deployment testing remain separate merchant setup items.

## Provider references

- [Duitku API](https://docs.duitku.com/api/id/)
- [Duitku Sandbox simulator](https://sandbox.duitku.com/payment/demo/demosuccesstransaction.aspx)
