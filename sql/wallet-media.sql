CREATE TABLE wallet_sessions (
  id TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  locale TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE cashback_periods (
  user_id BIGINT NOT NULL,
  period_key TEXT NOT NULL,
  turnover NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid NUMERIC(14,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, period_key)
);

CREATE TABLE wallet_referrals (
  code TEXT PRIMARY KEY,
  owner_id BIGINT NOT NULL,
  invited JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE volume_flags (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  deposited NUMERIC(14,2) NOT NULL,
  withdrawn NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE provider_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE transcode_jobs (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL,
  status TEXT NOT NULL,
  outputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
