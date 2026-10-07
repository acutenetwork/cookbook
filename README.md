# Cookbook: three ways to take a payment with Acute

Three real food apps, one per integration. Each one does a single thing, so the
code you read is the recipe and nothing else.

| App | Live | How the buyer pays | The recipe |
| --- | --- | --- | --- |
| **Chopdeck** | [withhandyman.com](https://withhandyman.com) | Taps Buy; Acute's checkout opens over the page. | `apps/chopdeck/src/lib/pay.ts`, `apps/chopdeck/src/components/buy-button.tsx` |
| **Rhemascry** | [fizopay.com](https://fizopay.com) | Taps Buy; is sent to Acute's hosted checkout and back. | `apps/rhemascry/src/lib/pay.ts` |
| **Raspbury** | | Taps Buy; it is paid from their Acute wallet, instantly. | `apps/raspbury/src/lib/store/checkout.ts`, `apps/raspbury/src/lib/wallet/` |

There is no payment-method picker anywhere. The Buy button goes straight to the
one way that app takes money.

## The three recipes

### Chopdeck: the embedded widget (`@acutenetwork/react`)

1. The server writes the order first and returns its id.
2. The browser creates the payment with the **publishable** key, using the order
   id as the idempotency key and as `orderId` metadata, and the checkout opens
   over the page.
3. The server looks the payment up with the **secret** key and ties it to the order.
4. The webhook marks the order paid. If the tab closed before step 3, the webhook
   finds the order by its `orderId` metadata, and only if the amount matches.

The client app in the Acute console must list the site's origin and declare the
`orderId` metadata key.

### Rhemascry: hosted checkout

1. The server writes the order, creates the payment with the secret key
   (`redirectUrl` back to the order, `cancelUrl` back to the dish), and redirects
   the buyer to its `checkoutUrl`.
2. Acute's checkout takes the transfer and sends the buyer back.
3. The webhook marks the order paid.

### Raspbury: wallets (a marketplace)

Every user gets an Acute wallet at sign-up. Sellers list dishes; buyers pay from
their wallet, and the money settles straight into the seller's wallet, with
Raspbury's cut split off by Acute in the same transaction. Users top up by bank
transfer and cash out to their bank.

### What all three share

- The order is written before any money moves, so a payment always has an order to land on.
- Order statuses only move forward, so a late or repeated webhook cannot undo a payment.
- The webhook is the fast road; the order page also asks Acute directly, so a slow
  webhook never leaves a buyer on "waiting".
- Money is integer kobo everywhere.

## Layout

```
apps/chopdeck     embedded widget       (shop: Acute settlement wallet)
apps/rhemascry    hosted checkout       (shop: Acute settlement wallet)
apps/raspbury     wallets               (marketplace: one wallet per user)
packages/acute    server client for the Acute API, webhook signature check
packages/store    the shop both chopdeck and rhemascry run on: schema, auth, orders, webhook
packages/ui       shadcn components, the shell, the theme
```

Chopdeck and Rhemascry are shops: the business is the only seller, so the money
lands in its own settlement wallet and Acute pays it out to its bank daily. A
browser-made payment cannot be pointed at someone else's wallet, which is why the
marketplace lives in Raspbury.

## Run it

```bash
pnpm install
cp apps/chopdeck/.env.example apps/chopdeck/.env.local    # and fill it in (same for the others)

# shop databases (chopdeck, rhemascry): schema and menu
pnpm --filter @cookbook/store db:migrate   # with TURSO_DATABASE_URL/SECRET in the shell
pnpm --filter @cookbook/store db:seed

# raspbury's database
pnpm --filter raspbury db:migrate

pnpm dev    # chopdeck :3001, rhemascry :3002, raspbury :3003
```

Register `https://<app>/api/webhooks/acute` in the Acute console for each app and
put its signing secret in that app's `ACUTE_WEBHOOK_SECRET`.

## Deploy

Push to `main`. `.github/workflows/deploy.yml` builds each app on Linux and ships
it to its own Vercel project (Root Directory `apps/<app>`). Repo secrets:
`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_CHOPDECK`,
`VERCEL_PROJECT_ID_RHEMASCRY`, `VERCEL_PROJECT_ID_RASPBURY`. Each app's runtime
variables live in its Vercel project.
