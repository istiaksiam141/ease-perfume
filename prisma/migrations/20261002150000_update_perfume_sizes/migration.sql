-- Replace the previous 7 ml option with the new 6 ml option while preserving
-- each variant's stock and availability. Historical order items keep their
-- recorded size and price snapshots.
UPDATE "ProductVariant"
SET "size" = '6 ml', "price" = 250
WHERE "size" = '7 ml';
