# Ease Perfume ordering system

This project keeps the Ease storefront in `public/store.html` and serves it at `/` through the Next.js application. Product artwork is served from `public/assets/`. Checkout and order management use server APIs and the configured Neon PostgreSQL database.

## What is included

- Cash-on-delivery checkout with Bangladesh phone validation and friendly form errors.
- Neon PostgreSQL order, order-item, admin, product, size-variant, stock and delivery settings tables.
- Server-side product/price/stock lookup. Browser-submitted totals and prices are ignored.
- Serializable order transaction with conditional stock decrement; failed orders roll back.
- Persistent cart in local storage and a receipt token for the just-created order confirmation.
- Customer tracking requires both order number and the matching phone number.
- Password-hashed admin setup/login, signed HttpOnly session cookie, protected admin pages and APIs.
- Admin order list/details/status control, product/stock management, customer list and delivery settings.
- A payment provider interface with COD as the only enabled payment method.

## Requirements

- Node.js 20.9 or newer.
- A Neon PostgreSQL database configured by `DATABASE_URL`.
- npm.

## Configure and run

From this directory:

1. Configure `DATABASE_URL` with the Neon connection string for this store. Keep it in the deployment secret manager or an ignored local `.env` file.
2. Set `SESSION_SECRET` to a private random value of at least 32 characters.
3. Set `ADMIN_SETUP_TOKEN` to a separate one-time random value of at least 24 characters for first-admin setup. Do not commit `.env` or share the token.
4. Install and build the application:

```sh
npm install
npx prisma generate
npm run build
npm run start
```

Use `npm run dev` for local development. The app connects to the same Neon database configured in `DATABASE_URL`; it does not use a local PostgreSQL server. Do not run `prisma migrate dev` or `db:seed` against production. Apply reviewed schema migrations with `npx prisma migrate deploy` only when a migration is needed.

## First admin and opening orders

1. If there is no admin account, visit `/admin/setup` and create the first account using `ADMIN_SETUP_TOKEN`. If an account already exists, sign in at `/admin/login` with its existing credentials; first-admin setup is disabled after account creation.
2. In Admin → Products, add each product with its deployed `/assets/...` image path. Set the per-size price and stock, then mark only fulfilable sizes available.
3. In Admin → Settings, set the delivery labels and fees for both delivery zones. Missing settings default to ৳0 until saved.
4. Add an available fragrance to the bag and complete checkout. The server reads current prices, stock, and delivery fees from Neon and calculates the order total. Orders appear in Admin → Orders.
5. The confirmation page displays the receipt in the same browser session. To track from another device, use the order number and the phone number entered at checkout.

New product images should be placed in `public/assets/`, then referenced from Admin → Products with a path such as `/assets/new-scent.png`. New products begin unavailable with zero stock.

## Environment variables

| Variable | Use |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string; server-side only. |
| `SESSION_SECRET` | Signs admin session cookies. Keep secret and stable across deploys. |
| `ADMIN_SETUP_TOKEN` | Authorizes the one-time first-admin account creation. Remove or rotate it after setup. |
| `NODE_ENV` | Set by Next.js in normal development/production workflows. |

## Deploying

Use the configured Neon database, keep secrets in the host's secret manager, and deploy with `npm run build` and `npm start`. Run `npx prisma migrate deploy` only when deploying a reviewed schema change. Enforce HTTPS in production so the admin session cookie is secure. Back up the database regularly. Product image files must be committed under `public/assets/` so they are included in production builds.

## Adding online payments later

Online payments are intentionally not enabled. Add a provider implementation behind `lib/payment.ts`, add a migration for the new method/state if needed, and implement provider callbacks/webhook signature verification. Keep order totals and inventory checks in `app/api/orders/route.ts`; never accept a payment amount from the browser. A gateway should create/confirm a payment against the server-calculated order total and only mark an order paid after a verified provider response.

## Limitations to configure before launch

- Actual stock quantities were not included with the supplied images, so inventory must be entered in Admin. Delivery fees default to ৳0 and can be edited in Admin → Settings.
- The first-admin setup token is needed only before the first admin account exists; it does not reset or replace existing accounts.
- This first version does not send SMS/email receipts or connect to a courier; it records the order and presents a browser receipt.
