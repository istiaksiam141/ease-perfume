UPDATE "StoreConfig"
SET "insideCityDelivery" = COALESCE("insideCityDelivery", 0),
    "outsideCityDelivery" = COALESCE("outsideCityDelivery", 0);

ALTER TABLE "StoreConfig"
  ALTER COLUMN "insideCityDelivery" SET DEFAULT 0,
  ALTER COLUMN "insideCityDelivery" SET NOT NULL,
  ALTER COLUMN "outsideCityDelivery" SET DEFAULT 0,
  ALTER COLUMN "outsideCityDelivery" SET NOT NULL;
