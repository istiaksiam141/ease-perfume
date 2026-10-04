# Ease Perfume

### Full-Stack E-Commerce Platform for a Perfume Store

Ease Perfume is a full-stack e-commerce application built for managing a perfume storefront, customer orders, inventory, and administrative operations.

The application provides a customer-facing shopping experience together with a protected admin dashboard for managing products, stock, orders, customers, and delivery settings.

> **Note:** This is my first complete full-stack project. I used **Codex as a coding assistant** throughout the development process to help me understand unfamiliar concepts, debug issues, and work through problems while building the application.

---

## 🌐 Live Demo

**Live Website:**
https://ease-perfume-55rw.vercel.app

**Source Code:**
https://github.com/istiaksiam141/ease-perfume

---

## 📸 Screenshots

### Storefront

<!-- Add your homepage screenshot here -->

### Product & Cart

<!-- Add your product/cart screenshot here -->

### Checkout

<!-- Add your checkout screenshot here -->

### Admin Dashboard

<!-- Add your admin dashboard screenshot here -->

---

## 🚀 Features

### Customer Experience

* Browse available perfume products
* View detailed product information
* Select different product sizes and variants
* Variant-specific pricing and inventory
* Persistent shopping cart
* Quantity management
* Cash-on-delivery checkout
* Bangladesh phone-number validation
* Delivery-area based charges
* Order confirmation
* Order tracking
* Customer-friendly form validation

### Order & Inventory Management

* Server-side product validation
* Server-side price verification
* Server-side stock verification
* Automatic stock deduction
* Transaction-based order creation
* Automatic rollback when an order transaction fails
* Unique order identification
* Order status management

### Admin Dashboard

* Secure admin authentication
* Product management
* Product image management
* Size and variant management
* Stock management
* Order management
* Customer management
* Delivery settings
* Order details and status updates
* Protected admin pages and APIs

### Product Image Storage

* Upload product images through the admin dashboard
* Support for JPEG, PNG, and WebP images
* Vercel Blob storage
* Persistent image URLs across deployments
* Support for existing local product assets

---

## 🛠️ Technology Stack

| Technology      | Purpose                          |
| --------------- | -------------------------------- |
| **Next.js**     | Full-stack application framework |
| **React**       | Frontend UI                      |
| **TypeScript**  | Type-safe development            |
| **PostgreSQL**  | Relational database              |
| **Neon**        | Managed PostgreSQL hosting       |
| **Prisma**      | Database ORM                     |
| **Vercel Blob** | Product image storage            |
| **bcryptjs**    | Password hashing                 |
| **Vercel**      | Deployment and hosting           |

---

## 🏗️ Application Architecture

The application is divided into two primary experiences.

### Customer Flow

```text
Storefront
    ↓
Product Selection
    ↓
Variant / Size Selection
    ↓
Shopping Cart
    ↓
Checkout
    ↓
Server Validation
    ↓
Order Creation
    ↓
Order Confirmation
    ↓
Order Tracking
```

### Admin Flow

```text
Admin Login
    ↓
Admin Dashboard
    ├── Products
    │   ├── Product Details
    │   ├── Variants
    │   └── Stock
    │
    ├── Orders
    │   ├── Order Details
    │   └── Order Status
    │
    ├── Customers
    │
    └── Delivery Settings
```

---

## 🔐 Security & Data Validation

A major focus of the project was making sure important business logic is handled on the server rather than being trusted from the browser.

### Server-Side Validation

The application does not rely on browser-submitted prices or totals.

When an order is submitted:

1. The server retrieves the current product and variant information.
2. Current prices are read from the database.
3. Available stock is checked.
4. Delivery charges are retrieved from the configured settings.
5. The final order total is calculated on the server.
6. The order and inventory changes are processed inside a database transaction.

This helps prevent manipulated client-side prices or inconsistent stock from being used when creating orders.

### Authentication & Sessions

* Admin passwords are securely hashed.
* Admin sessions use signed HttpOnly cookies.
* Admin pages require authentication.
* Admin APIs are protected.
* Initial admin creation requires a separate setup token.
* Sensitive configuration is stored using environment variables.

---

## 📦 Database

The application uses **PostgreSQL** with **Prisma ORM**.

The database handles information including:

* Products
* Size variants
* Stock quantities
* Orders
* Order items
* Customers
* Admin accounts
* Delivery settings

Order creation and stock deduction are handled transactionally so that failed operations do not leave the database in an inconsistent state.

---

## 💳 Payment

The current version supports:

### Cash on Delivery

Online payments are intentionally not enabled in the current version.

The application includes a payment-provider interface that can be extended later to support online payment gateways.

Any future payment integration should verify payments through the provider's server-side response or webhook rather than trusting payment information submitted by the browser.

---

## 🖼️ Image Management

Product images can be managed directly from the admin dashboard.

Supported options include:

* JPEG
* PNG
* WebP
* HTTPS image URLs
* Existing `/assets/...` paths

Uploaded images are stored in **Vercel Blob**, while their public URLs are stored in the product database record.

This allows uploaded product images to remain available across deployments.

---

## 🚚 Delivery Management

Delivery zones and delivery fees can be configured through:

```text
Admin → Settings
```

The checkout system retrieves the configured delivery fee and includes it in the server-calculated order total.

---

## ⚙️ Requirements

Before running the project locally, make sure you have:

* Node.js **20.9+**
* npm
* A PostgreSQL database
* A Neon PostgreSQL database is recommended for the current setup

---

## 🧑‍💻 Local Development

### 1. Clone the repository

```bash
git clone https://github.com/istiaksiam141/ease-perfume.git
cd ease-perfume
```

### 2. Install dependencies

```bash
npm install
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="your-neon-postgresql-connection-string"
SESSION_SECRET="your-random-session-secret"
ADMIN_SETUP_TOKEN="your-one-time-admin-setup-token"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

### 5. Start the development server

```bash
npm run dev
```

The application should now be available at:

```text
http://localhost:3000
```

---

## 🏭 Production Build

To create a production build:

```bash
npm run build
```

Then start the production server:

```bash
npm run start
```

For database schema changes, use reviewed migrations:

```bash
npx prisma migrate deploy
```

Do not run development migrations or seed commands against the production database unless intentionally configured for that environment.

---

## 🔑 Environment Variables

| Variable                | Description                               |
| ----------------------- | ----------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string              |
| `SESSION_SECRET`        | Secret used to sign admin sessions        |
| `ADMIN_SETUP_TOKEN`     | One-time token for initial admin creation |
| `BLOB_READ_WRITE_TOKEN` | Server-side Vercel Blob access token      |
| `NODE_ENV`              | Application environment                   |

> **Never commit `.env` files or expose server-side secrets through client-side environment variables.**

---

## 👤 Initial Admin Setup

If no administrator account exists:

1. Navigate to `/admin/setup`
2. Provide the configured `ADMIN_SETUP_TOKEN`
3. Create the first admin account
4. Sign in through `/admin/login`

Once an admin account has been created, the initial setup process is disabled.

---

## 📋 Product Setup

After logging into the admin dashboard:

1. Open **Products**
2. Add or edit a product
3. Upload or provide a product image
4. Configure available sizes
5. Set prices for each variant
6. Set stock quantities
7. Mark fulfilable variants as available

New products begin unavailable with zero stock until inventory is configured.

---

## 🚧 Current Limitations

This is the first version of the application, so several areas can be expanded in future versions.

* Online payment gateway is not currently enabled.
* SMS/email order notifications are not implemented.
* Courier API integration is not currently available.
* Inventory quantities must be configured manually.
* Automated test coverage can be expanded.
* Additional production-level security protections can be added.

---

## 🔮 Future Improvements

Planned or potential improvements include:

* Online payment gateway integration
* SMS and email order notifications
* Courier service API integration
* Automated unit and integration testing
* Rate limiting and brute-force protection
* Improved analytics and reporting
* Customer accounts and order history
* Product search and advanced filtering
* More detailed admin activity logs
* CI/CD testing through GitHub Actions

---

## 📚 What I Learned

Building Ease Perfume gave me practical experience with:

* Full-stack application development
* Next.js and React
* TypeScript
* PostgreSQL
* Prisma ORM
* REST-style server APIs
* Authentication and session management
* Server-side validation
* Database transactions
* Inventory management
* Cloud storage
* Deployment with Vercel
* Debugging and troubleshooting
* Working with production environment variables

Because this was my **first complete full-stack project**, a large part of the process involved learning how the frontend, backend, database, authentication, storage, and deployment work together.

I also used **Codex as a coding assistant** throughout development. It helped me when I was stuck, needed an explanation, or wanted guidance while debugging and improving different parts of the application.

---

## 🤝 Project Status

**Status:** Active / First Production Version

The application is currently deployed and functional. I plan to continue improving the project as I learn more about full-stack development, testing, security, and production deployment.

---

## 📄 License

This project was created for learning and development purposes.

If you plan to reuse or deploy the project commercially, review the source code and dependencies before doing so.
