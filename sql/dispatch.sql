-- Multi-tenant dispatch (synthetic schema)

CREATE TABLE companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  company_id BIGINT REFERENCES companies(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ
);

-- Operational tables live in a per-company database/pool.

CREATE TABLE drivers (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline',
  vehicle_year INTEGER
);

CREATE TABLE vehicles (
  id BIGSERIAL PRIMARY KEY,
  plate TEXT NOT NULL,
  year INTEGER,
  has_sticker BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE driver_vehicle_assignments (
  driver_id BIGINT NOT NULL REFERENCES drivers(id),
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  passenger_id TEXT NOT NULL,
  driver_id BIGINT,
  status TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  dropoff_lat DOUBLE PRECISION NOT NULL,
  dropoff_lng DOUBLE PRECISION NOT NULL,
  tariff TEXT NOT NULL,
  estimated_price NUMERIC(10,2),
  final_price NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rating_events (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT NOT NULL,
  order_id BIGINT NOT NULL,
  score INTEGER NOT NULL,
  status TEXT NOT NULL,
  reason_tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE driver_stats (
  driver_id BIGINT PRIMARY KEY,
  rating NUMERIC(4,2),
  priority INTEGER NOT NULL DEFAULT 0,
  accepted_orders INTEGER NOT NULL DEFAULT 0,
  skipped_orders INTEGER NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  rating_updated_at TIMESTAMPTZ,
  priority_updated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE driver_priority_change_log (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT NOT NULL,
  order_id BIGINT,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
