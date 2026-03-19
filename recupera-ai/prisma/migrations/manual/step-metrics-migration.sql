-- ============================================================
-- Migration: Step Metrics + TrackedLink UTM fields
-- Run this SQL when the Neon database quota resets
-- Command: psql $DATABASE_URL -f prisma/migrations/manual/step-metrics-migration.sql
-- ============================================================

-- 1. Add new columns to tracked_links
ALTER TABLE "tracked_links" ADD COLUMN IF NOT EXISTS "step_number" INTEGER;
ALTER TABLE "tracked_links" ADD COLUMN IF NOT EXISTS "utm_source" TEXT;
ALTER TABLE "tracked_links" ADD COLUMN IF NOT EXISTS "utm_medium" TEXT;
ALTER TABLE "tracked_links" ADD COLUMN IF NOT EXISTS "utm_campaign" TEXT;
ALTER TABLE "tracked_links" ADD COLUMN IF NOT EXISTS "utm_content" TEXT;

-- 2. Create step_metrics table
CREATE TABLE IF NOT EXISTS "step_metrics" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "cart_type" "CartType" NOT NULL DEFAULT 'ABANDONED_CART',
    "step_number" INTEGER NOT NULL,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "messages_delivered" INTEGER NOT NULL DEFAULT 0,
    "messages_read" INTEGER NOT NULL DEFAULT 0,
    "link_clicks" INTEGER NOT NULL DEFAULT 0,
    "messages_replied" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversion_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ai_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "step_metrics_pkey" PRIMARY KEY ("id")
);

-- 3. Create unique constraint (prevents duplicate entries per store/date/type/step)
CREATE UNIQUE INDEX IF NOT EXISTS "step_metrics_store_id_date_cart_type_step_number_key"
    ON "step_metrics"("store_id", "date", "cart_type", "step_number");

-- 4. Create performance index
CREATE INDEX IF NOT EXISTS "step_metrics_store_id_date_idx"
    ON "step_metrics"("store_id", "date");

-- ============================================================
-- Verification: Run after migration to confirm
-- ============================================================
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'step_metrics';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'tracked_links' AND column_name = 'step_number';
