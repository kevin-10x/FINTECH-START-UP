-- AI MicroBank PostgreSQL schema

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  phone VARCHAR(20) UNIQUE,
  full_name VARCHAR(255),
  national_id VARCHAR(50),
  ai_identity_score INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'KES'
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY,
  sender_wallet UUID,
  receiver_wallet UUID,
  amount DECIMAL(15,2),
  transaction_type VARCHAR(50),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2),
  interest_rate DECIMAL(5,2),
  repayment_status VARCHAR(50),
  ai_risk_score INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY,
  phone VARCHAR(20),
  code VARCHAR(10),
  expires_at TIMESTAMP,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);
