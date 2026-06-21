-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference VARCHAR(100) UNIQUE NOT NULL,
  transaction_id VARCHAR(100),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'XAF',
  phone VARCHAR(20),
  operator VARCHAR(50),
  country_code VARCHAR(10),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at);

-- ============================================
-- WALLETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallets_user ON wallets(user_id);

-- ============================================
-- WALLET TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'subscription')),
  amount DECIMAL(12,2) NOT NULL,
  reference VARCHAR(100),
  transaction_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_tx_type ON wallet_transactions(type);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update wallet updated_at on balance change
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallet_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_timestamp();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage transactions" ON transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Wallets policies
CREATE POLICY "Users can view own wallet" ON wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage wallets" ON wallets
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Wallet transactions policies
CREATE POLICY "Users can view own wallet transactions" ON wallet_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage wallet transactions" ON wallet_transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON transactions TO authenticated;
GRANT SELECT ON wallets TO authenticated;
GRANT SELECT ON wallet_transactions TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
