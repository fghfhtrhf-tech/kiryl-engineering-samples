-- Extra operational tables used by the sanitized samples

CREATE TABLE payouts (
  id BIGSERIAL PRIMARY KEY,
  courier_id TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  period_key TEXT NOT NULL,
  status TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE referral_edges (
  referrer_id TEXT NOT NULL,
  referee_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  applicant_key TEXT NOT NULL,
  kind TEXT NOT NULL,
  object_key TEXT NOT NULL,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_outbox (
  id BIGSERIAL PRIMARY KEY,
  channel TEXT NOT NULL,
  destination TEXT NOT NULL,
  template TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  error TEXT
);

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shifts (
  id BIGSERIAL PRIMARY KEY,
  courier_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  online_seconds INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE leads (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  phone TEXT,
  applicant_key TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
