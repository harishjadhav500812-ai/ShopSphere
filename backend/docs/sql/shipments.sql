-- shipments / shippings table
CREATE TABLE IF NOT EXISTS shippings (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE,
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  tracking_number VARCHAR(100) UNIQUE,
  shipping_status VARCHAR(30) NOT NULL DEFAULT 'READY',
  carrier VARCHAR(100),
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version BIGINT
);

ALTER TABLE IF EXISTS shippings
  ADD CONSTRAINT fk_shippings_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_shippings_order ON shippings(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shippings_tracking_number ON shippings(tracking_number);
