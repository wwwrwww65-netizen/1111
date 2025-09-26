-- Idempotent DDL for new admin modules (shipping, payments, carts, notifications, logistics, accounting)
CREATE TABLE IF NOT EXISTS "ShippingZone" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "countryCodes" TEXT[] NOT NULL,
  "regions" JSONB,
  "cities" JSONB,
  "areas" JSONB,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "DeliveryRate" (
  "id" TEXT PRIMARY KEY,
  "zoneId" TEXT NOT NULL,
  "carrier" TEXT,
  "minWeightKg" DOUBLE PRECISION,
  "maxWeightKg" DOUBLE PRECISION,
  "baseFee" DOUBLE PRECISION NOT NULL,
  "perKgFee" DOUBLE PRECISION,
  "minSubtotal" DOUBLE PRECISION,
  "freeOverSubtotal" DOUBLE PRECISION,
  "etaMinHours" INTEGER,
  "etaMaxHours" INTEGER,
  "offerTitle" TEXT,
  "activeFrom" TIMESTAMP,
  "activeUntil" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "DeliveryRate_zone_idx" ON "DeliveryRate"("zoneId");

CREATE TABLE IF NOT EXISTS "PaymentGateway" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'TEST',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "feesFixed" DOUBLE PRECISION,
  "feesPercent" DOUBLE PRECISION,
  "minAmount" DOUBLE PRECISION,
  "maxAmount" DOUBLE PRECISION,
  "credentials" JSONB,
  "options" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "GuestCart" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT UNIQUE NOT NULL,
  "userAgent" TEXT,
  "ip" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS "GuestCartItem" (
  "id" TEXT PRIMARY KEY,
  "cartId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "addedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "GuestCartItem_cart_idx" ON "GuestCartItem"("cartId");

CREATE TABLE IF NOT EXISTS "NotificationLog" (
  "id" TEXT PRIMARY KEY,
  "channel" TEXT NOT NULL,
  "target" TEXT,
  "title" TEXT,
  "body" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SENT',
  "error" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "NotificationLog_created_idx" ON "NotificationLog"("createdAt");

-- Basic logistics tables (safe if already exist)
CREATE TABLE IF NOT EXISTS "Driver" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "status" TEXT,
  "lat" DOUBLE PRECISION,
  "lng" DOUBLE PRECISION,
  "lastSeenAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS "ShipmentLeg" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT,
  "poId" TEXT,
  "legType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "driverId" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ShipmentLeg_orderId_idx" ON "ShipmentLeg"("orderId");
CREATE INDEX IF NOT EXISTS "ShipmentLeg_poId_idx" ON "ShipmentLeg"("poId");

CREATE TABLE IF NOT EXISTS "Package" (
  "id" TEXT PRIMARY KEY,
  "barcode" TEXT UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Package_status_idx" ON "Package"("status");

