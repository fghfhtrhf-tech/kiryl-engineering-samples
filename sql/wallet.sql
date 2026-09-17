-- Signed-callback wallet (synthetic schema; not an operator product)

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  locale TEXT NOT NULL DEFAULT 'en',
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  bonus_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  bonus_deposits_count INTEGER NOT NULL DEFAULT 0,
  active_bonus JSONB,
  deposit_wager_remaining NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE crypto_deposits (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  payment_id TEXT UNIQUE NOT NULL,
  order_id TEXT,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL,
  pay_amount NUMERIC(18,8),
  pay_address TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE withdrawals (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  amount NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE support_tickets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
