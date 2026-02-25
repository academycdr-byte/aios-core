-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('SHOPIFY', 'NUVEMSHOP');

-- CreateEnum
CREATE TYPE "CartType" AS ENUM ('ABANDONED_CART', 'PIX_PENDING', 'CARD_DECLINED');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('PENDING', 'CONTACTING', 'RECOVERED', 'PAID', 'LOST', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'RECOVERED', 'LOST', 'ESCALATED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('AI', 'CUSTOMER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "domain" TEXT,
    "access_token" TEXT,
    "shopify_domain" TEXT,
    "shopify_webhook_id" TEXT,
    "nuvemshop_store_id" TEXT,
    "whatsapp_phone" TEXT,
    "whatsapp_connected" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "webhook_secret" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_settings" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "store_name" TEXT,
    "store_description" TEXT,
    "main_products" TEXT,
    "target_audience" TEXT,
    "shipping_policy" TEXT,
    "return_policy" TEXT,
    "payment_methods" TEXT,
    "warranty_policy" TEXT,
    "faq_content" TEXT,
    "current_offers" TEXT,
    "can_offer_discount" BOOLEAN NOT NULL DEFAULT false,
    "max_discount_percent" DOUBLE PRECISION,
    "coupon_code" TEXT,
    "coupon_discount" DOUBLE PRECISION,
    "ai_tone" TEXT NOT NULL DEFAULT 'profissional',
    "ai_name" TEXT NOT NULL DEFAULT 'Assistente',
    "custom_instructions" TEXT,
    "business_hours_start" TEXT,
    "business_hours_end" TEXT,
    "send_outside_hours" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_configs" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "first_message_delay" INTEGER NOT NULL DEFAULT 30,
    "follow_up_1_delay" INTEGER NOT NULL DEFAULT 360,
    "follow_up_2_delay" INTEGER NOT NULL DEFAULT 1440,
    "follow_up_3_delay" INTEGER,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "first_message_template" TEXT,
    "follow_up_1_template" TEXT,
    "follow_up_2_template" TEXT,
    "follow_up_3_template" TEXT,
    "min_cart_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exclude_returning" BOOLEAN NOT NULL DEFAULT false,
    "pix_recovery_enabled" BOOLEAN NOT NULL DEFAULT true,
    "pix_first_delay" INTEGER NOT NULL DEFAULT 15,
    "pix_follow_up_delay" INTEGER NOT NULL DEFAULT 120,
    "pix_max_attempts" INTEGER NOT NULL DEFAULT 2,
    "card_recovery_enabled" BOOLEAN NOT NULL DEFAULT true,
    "card_first_delay" INTEGER NOT NULL DEFAULT 10,
    "card_max_attempts" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recovery_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abandoned_carts" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "cart_total" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "cart_items" JSONB NOT NULL,
    "item_count" INTEGER NOT NULL DEFAULT 1,
    "checkout_url" TEXT,
    "platform_cart_id" TEXT,
    "platform_order_id" TEXT,
    "type" "CartType" NOT NULL DEFAULT 'ABANDONED_CART',
    "status" "CartStatus" NOT NULL DEFAULT 'PENDING',
    "recovery_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "recovered_at" TIMESTAMP(3),
    "recovered_value" DOUBLE PRECISION,
    "paid_at" TIMESTAMP(3),
    "paid_value" DOUBLE PRECISION,
    "abandoned_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abandoned_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "abandoned_cart_id" TEXT,
    "customer_phone" TEXT NOT NULL,
    "customer_name" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "ai_model" TEXT,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "whatsapp_msg_id" TEXT,
    "message_status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "tokens_used" INTEGER,
    "model_used" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "abandoned_count" INTEGER NOT NULL DEFAULT 0,
    "abandoned_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contacted_count" INTEGER NOT NULL DEFAULT 0,
    "recovered_count" INTEGER NOT NULL DEFAULT 0,
    "recovered_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paid_count" INTEGER NOT NULL DEFAULT 0,
    "paid_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avg_ticket" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recovery_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_conversations" INTEGER NOT NULL DEFAULT 0,
    "avg_messages_per_conv" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ai_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "store_settings_store_id_key" ON "store_settings"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "recovery_configs_store_id_key" ON "recovery_configs"("store_id");

-- CreateIndex
CREATE INDEX "abandoned_carts_store_id_status_idx" ON "abandoned_carts"("store_id", "status");

-- CreateIndex
CREATE INDEX "abandoned_carts_store_id_abandoned_at_idx" ON "abandoned_carts"("store_id", "abandoned_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_abandoned_cart_id_key" ON "conversations"("abandoned_cart_id");

-- CreateIndex
CREATE INDEX "conversations_store_id_status_idx" ON "conversations"("store_id", "status");

-- CreateIndex
CREATE INDEX "messages_conversation_id_sent_at_idx" ON "messages"("conversation_id", "sent_at");

-- CreateIndex
CREATE INDEX "daily_metrics_store_id_date_idx" ON "daily_metrics"("store_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_metrics_store_id_date_key" ON "daily_metrics"("store_id", "date");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_configs" ADD CONSTRAINT "recovery_configs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abandoned_carts" ADD CONSTRAINT "abandoned_carts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_abandoned_cart_id_fkey" FOREIGN KEY ("abandoned_cart_id") REFERENCES "abandoned_carts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
