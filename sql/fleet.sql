-- Courier onboarding / loyalty / support (synthetic schema)

CREATE TABLE drivers (
  id BIGSERIAL PRIMARY KEY,
  applicant_key TEXT UNIQUE NOT NULL,
  partner_driver_id TEXT UNIQUE,
  partner_vehicle_id TEXT,
  phone TEXT,
  full_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  loyalty_level TEXT NOT NULL DEFAULT 'base',
  work_rule_id TEXT,
  referred_by TEXT,
  cash_today NUMERIC(14,2) NOT NULL DEFAULT 0,
  cash_6d NUMERIC(14,2) NOT NULL DEFAULT 0,
  cash_month NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE applications (
  id BIGSERIAL PRIMARY KEY,
  applicant_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  photo_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  partner_response JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loyalty_events (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  period_key TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  idempotency_key TEXT NOT NULL UNIQUE,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE referral_earnings (
  id BIGSERIAL PRIMARY KEY,
  to_driver_id BIGINT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  from_driver_id BIGINT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  period_key TEXT NOT NULL,
  kind TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE daily_cash (
  driver_id BIGINT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (driver_id, day)
);

CREATE TABLE funnel_events (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'bot',
  event TEXT NOT NULL,
  applicant_key TEXT,
  session_id TEXT,
  path TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  msg_type TEXT NOT NULL,
  body TEXT,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bot_sessions (
  token TEXT PRIMARY KEY,
  applicant_key TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
