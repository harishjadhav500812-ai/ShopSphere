-- coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type VARCHAR(20) NOT NULL,
  discount_value NUMERIC(19,2) NOT NULL,
  minimum_order_amount NUMERIC(19,2),
  maximum_discount_amount NUMERIC(19,2),
  start_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version BIGINT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code_upper ON coupons(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);
