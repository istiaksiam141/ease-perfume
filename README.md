# Ease Perfume ordering system

This project keeps the original Ease storefront in `public/store.html` and serves it at `/` through the small Next.js application. The logo, uploaded product artwork, colors, typography, responsive rules, product cards, cursor movement and 3D interactions remain in that storefront. Checkout and order management are added as app routes and server APIs.

## What is included

- Cash-on-delivery checkout with Bangladesh phone validation and friendly form errors.
- PostgreSQL order, order-item, customer, admin, product, size-variant, stock and delivery settings tables.
- Server-side product/price/stock lookup. Browser-submitted totals and prices are ignored.
- Serializable order transaction with conditional stock decrement; failed orders roll back.
- Persistent cart in local storage and a receipt token for the just-created order confirmation.
- Customer tracking requires both order number and the matching phone number.
- Password-hashed admin setup/login, signed HttpOnly session cookie, protected admin pages and APIs.
- Admin order list/details/status control, product/stock management, customer list and delivery settings.
- A payment provider interface with COD as the only enabled payment method.

## Requirements

- Node.js 20.9 or newer.
- PostgreSQL 14 or newer.
- npm.

## Configure and run

From this directory:

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your PostgreSQL connection string. Use a database dedicated to this store.
3. Set `SESSION_SECRET` to a private random value of at least 32 characters.
4. Set `ADMIN_SETUP_TOKEN` to a separate one-time random value of at least 24 characters. Do not commit `.env` or share the token.
5. Install and initialize the database:

```sh
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open `http://localhost:3000` for the storefront.

The seed adds the 16 products whose names are visible in the supplied photos and the two sizes/starting prices you provided. Fragrance notes, gender and scent families are left blank where you did not supply them. Stock starts at zero, all variants start unavailable, and both delivery fees start at ৳0. You can edit delivery fees in Admin → Settings.

## First admin and opening orders

1. Visit `http://localhost:3000/admin/setup` and create the first admin account using `ADMIN_SETUP_TOKEN`. Use a unique email and a password of at least 12 characters.
2. Visit Admin → Products. Enter the real quantity you have for each size, confirm the prices, and enable only the variants you can fulfil.
3. Visit Admin → Settings. Edit the delivery labels and fees for both delivery zones. Fees may be ৳0.
4. Add an available fragrance to the bag and complete checkout. Choose Cash on Delivery. The successful order appears in Admin → Orders.
5. The confirmation page displays the receipt in the same browser session. To track from another device, use the order number and the phone number entered at checkout.

New product images should be placed in `public/assets/`, then referenced from Admin → Products with a path such as `/assets/new-scent.png`. New products begin unavailable with zero stock.

## Environment variables

| Variable | Use |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string; server-side only. |
| `SESSION_SECRET` | Signs admin session cookies. Keep secret and stable across deploys. |
| `ADMIN_SETUP_TOKEN` | Authorizes the one-time first-admin account creation. Remove or rotate it after setup. |
| `NODE_ENV` | Set by Next.js in normal development/production workflows. |

## Deploying

Use a managed PostgreSQL database, set the three secrets in the host's secret manager, run `npx prisma migrate deploy`, then run `npm run build` and `npm start`. Enforce HTTPS in production so the admin session cookie is secure. Back up the database regularly.

## Adding online payments later

Online payments are intentionally not enabled. Add a provider implementation behind `lib/payment.ts`, add a migration for the new method/state if needed, and implement provider callbacks/webhook signature verification. Keep order totals and inventory checks in `app/api/orders/route.ts`; never accept a payment amount from the browser. A gateway should create/confirm a payment against the server-calculated order total and only mark an order paid after a verified provider response.

## Limitations to configure before launch

- Actual stock quantities were not included with the supplied images, so inventory must be entered in Admin. Delivery fees default to ৳0 and can be edited in Admin → Settings.
- The first-admin setup token and database must be configured before any order-management feature can be used.
- This first version does not send SMS/email receipts or connect to a courier; it records the order and presents a browser receipt.
