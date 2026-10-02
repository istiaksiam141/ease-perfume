ALTER TABLE "Admin"
  ADD COLUMN "isMainAdmin" BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE "Admin"
SET "isMainAdmin" = TRUE
WHERE "id" = (
  SELECT "id"
  FROM "Admin"
  ORDER BY "createdAt" ASC, "id" ASC
  LIMIT 1
);
