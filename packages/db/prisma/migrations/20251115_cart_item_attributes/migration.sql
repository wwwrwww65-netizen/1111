-- Add attributes column to CartItem and GuestCartItem if missing
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS attributes JSONB;
ALTER TABLE "GuestCartItem" ADD COLUMN IF NOT EXISTS attributes JSONB;


