-- Expand the users table with structured profile fields.
ALTER TABLE "users"
ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "avatarUrl" TEXT;

-- Backfill existing records from the legacy full-name field.
--
-- The legacy schema stored the complete name in one column, so the
-- migration preserves the first word as firstName and the remaining
-- words as lastName.
UPDATE "users"
SET
  "firstName" = split_part(btrim("name"), ' ', 1),
  "lastName" = CASE
    WHEN strpos(btrim("name"), ' ') > 0
      THEN btrim(
        substring(
          btrim("name")
          FROM strpos(btrim("name"), ' ') + 1
        )
      )
    ELSE ''
  END;

-- Enforce the final profile constraints after the backfill.
ALTER TABLE "users"
ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL;