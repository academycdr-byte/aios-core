-- Add seller persona fields
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS seller_name TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS seller_persona TEXT;

-- Add product detail fields  
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS delivery_timeframes TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS size_guide TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS product_specs TEXT;
