CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('COD');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID');

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "brand" TEXT NOT NULL DEFAULT 'Ease',
  "category" TEXT,
  "gender" TEXT,
  "fragranceFamily" TEXT,
  "topNotes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "heartNotes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "baseNotes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "description" TEXT,
  "image" TEXT NOT NULL,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "available" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductVariant" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "available" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductVariant_price_check" CHECK ("price" >= 0),
  CONSTRAINT "ProductVariant_stock_check" CHECK ("stock" >= 0)
);

CREATE TABLE "Order" (
  "id" SERIAL NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "receiptToken" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "note" TEXT,
  "deliveryZone" TEXT NOT NULL,
  "subtotal" INTEGER NOT NULL,
  "deliveryCharge" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "orderStatus" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Order_financials_check" CHECK ("subtotal" >= 0 AND "deliveryCharge" >= 0 AND "total" = "subtotal" + "deliveryCharge")
);

CREATE TABLE "OrderItem" (
  "id" SERIAL NOT NULL,
  "orderId" INTEGER NOT NULL,
  "productId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "productImage" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "totalPrice" INTEGER NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrderItem_quantity_check" CHECK ("quantity" > 0),
  CONSTRAINT "OrderItem_price_check" CHECK ("unitPrice" >= 0 AND "totalPrice" = "unitPrice" * "quantity")
);

CREATE TABLE "Admin" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoreConfig" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "insideCityLabel" TEXT NOT NULL DEFAULT 'Inside city',
  "outsideCityLabel" TEXT NOT NULL DEFAULT 'Outside city',
  "insideCityDelivery" INTEGER,
  "outsideCityDelivery" INTEGER,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoreConfig_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoreConfig_charges_check" CHECK (("insideCityDelivery" IS NULL OR "insideCityDelivery" >= 0) AND ("outsideCityDelivery" IS NULL OR "outsideCityDelivery" >= 0))
);

CREATE UNIQUE INDEX "ProductVariant_productId_size_key" ON "ProductVariant"("productId", "size");
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_receiptToken_key" ON "Order"("receiptToken");
CREATE INDEX "Order_phone_orderNumber_idx" ON "Order"("phone", "orderNumber");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_orderStatus_idx" ON "Order"("orderStatus");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
