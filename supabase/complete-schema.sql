-- ============================================
-- WEBCA$H COMPLETE DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE USER TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  country VARCHAR(10),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'seller', 'affiliate', 'admin')),
  is_active BOOLEAN DEFAULT true,
  is_banned BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  
  -- Subscription
  subscription_active BOOLEAN DEFAULT false,
  subscription_expires_at TIMESTAMPTZ,
  subscription_purchased_at TIMESTAMPTZ,
  
  -- Daily slot system
  daily_slot_used BOOLEAN DEFAULT false,
  last_slot_date DATE,
  
  -- Trust/Reputation
  trust_score INTEGER DEFAULT 0,
  trust_tier VARCHAR(20) DEFAULT 'new' CHECK (trust_tier IN ('new', 'bronze', 'silver', 'gold', 'platinum')),
  total_sales INTEGER DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  
  -- Sales goal
  sales_goal DECIMAL(12,2),
  sales_goal_period VARCHAR(20) DEFAULT 'monthly',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_subscription ON users(subscription_active);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- PAYMENT TABLES
-- ============================================

-- Pending payments (for webhook processing)
CREATE TABLE IF NOT EXISTS pending_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(100) UNIQUE NOT NULL,
  transaction_id VARCHAR(100),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referrer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  expected_amount DECIMAL(12,2) NOT NULL,
  expected_currency VARCHAR(10) NOT NULL,
  phone VARCHAR(20),
  operator VARCHAR(50),
  country_code VARCHAR(10),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'amount_mismatch')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

CREATE INDEX idx_pending_payments_reference ON pending_payments(reference);
CREATE INDEX idx_pending_payments_user ON pending_payments(user_id);
CREATE INDEX idx_pending_payments_status ON pending_payments(status);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference VARCHAR(100) UNIQUE NOT NULL,
  transaction_id VARCHAR(100),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'XAF',
  type VARCHAR(20) NOT NULL CHECK (type IN ('subscription', 'product_purchase', 'withdrawal', 'referral', 'refund')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- ============================================
-- WALLET TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) DEFAULT 0 CHECK (balance >= 0),
  pending_balance DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallets_user ON wallets(user_id);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'sale', 'referral', 'subscription', 'refund')),
  amount DECIMAL(12,2) NOT NULL,
  reference VARCHAR(100),
  transaction_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id);

-- ============================================
-- REFERRAL SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'completed',
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_referrer ON referral_earnings(referrer_id);

-- ============================================
-- PRODUCTS & MARKETPLACE
-- ============================================

-- Digital Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  short_description TEXT,
  full_description TEXT,
  what_you_get TEXT,
  who_its_for TEXT,
  category VARCHAR(50) NOT NULL,
  tags TEXT[],
  price DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2),
  currency VARCHAR(10) DEFAULT 'XAF',
  thumbnail_url TEXT,
  file_url TEXT,
  file_name VARCHAR(255),
  file_size BIGINT,
  
  -- AI generated fields
  ai_generated BOOLEAN DEFAULT false,
  
  -- Flash sale
  flash_sale_active BOOLEAN DEFAULT false,
  flash_sale_price DECIMAL(12,2),
  flash_sale_ends_at TIMESTAMPTZ,
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  sale_count INTEGER DEFAULT 0,
  wishlist_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_published ON products(is_published);

-- Product Bundles
CREATE TABLE IF NOT EXISTS product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  bundle_price DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2),
  savings_percentage DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE
);

-- Product Sales
CREATE TABLE IF NOT EXISTS product_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'XAF',
  status VARCHAR(20) DEFAULT 'completed',
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_sales_product ON product_sales(product_id);
CREATE INDEX idx_product_sales_buyer ON product_sales(buyer_id);
CREATE INDEX idx_product_sales_seller ON product_sales(seller_id);

-- ============================================
-- COURSES & TUTORIALS
-- ============================================

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category VARCHAR(50) NOT NULL,
  instructor VARCHAR(100),
  instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  duration VARCHAR(50),
  lessons_count INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  upload_type VARCHAR(20) DEFAULT 'manual' CHECK (upload_type IN ('manual', 'link')),
  content_url TEXT,
  files JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_published ON courses(is_published);

-- Tutorials
CREATE TABLE IF NOT EXISTS tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  thumbnail_url TEXT,
  category VARCHAR(50) NOT NULL,
  video_url TEXT,
  files JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STREAMING ACCOUNTS
-- ============================================

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL,
  service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('streaming', 'social', 'iptv', 'gaming', 'other')),
  login_email VARCHAR(255) NOT NULL,
  login_password VARCHAR(255) NOT NULL,
  additional_info TEXT,
  expiry_date DATE,
  max_slots INTEGER DEFAULT 1,
  available_slots INTEGER DEFAULT 1,
  is_multi_user BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, account_id)
);

-- ============================================
-- PROXIES
-- ============================================

CREATE TABLE IF NOT EXISTS proxies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL,
  username VARCHAR(100),
  password VARCHAR(100),
  protocol VARCHAR(10) DEFAULT 'http' CHECK (protocol IN ('http', 'https', 'socks4', 'socks5')),
  country VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUPPORT & COMMUNICATION
-- ============================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id VARCHAR(100) NOT NULL,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin', 'ai')),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS & PODCASTS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WISHLIST
-- ============================================

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlist_user ON wishlists(user_id);

-- ============================================
-- AFFILIATE MARKETPLACE
-- ============================================

CREATE TABLE IF NOT EXISTS affiliate_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commission_percentage DECIMAL(5,2) NOT NULL,
  commission_fixed DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES affiliate_offers(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  custom_code VARCHAR(50) UNIQUE,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FLASH SALES
-- ============================================

CREATE TABLE IF NOT EXISTS flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_percentage DECIMAL(5,2) NOT NULL,
  sale_price DECIMAL(12,2) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QR CODES
-- ============================================

CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('product', 'seller', 'course')),
  entity_id UUID NOT NULL,
  qr_url TEXT NOT NULL,
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LIVE SALES FEED
-- ============================================

CREATE TABLE IF NOT EXISTS live_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_title VARCHAR(255) NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  buyer_country VARCHAR(10),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'XAF',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_live_sales_created ON live_sales(created_at DESC);

-- ============================================
-- ACADEMY/LEARNING
-- ============================================

CREATE TABLE IF NOT EXISTS academy_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  lessons JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academy_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  completed_lessons TEXT[] DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- ============================================
-- HELP CENTER
-- ============================================

CREATE TABLE IF NOT EXISTS help_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  category VARCHAR(50),
  media_urls TEXT[],
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SETTINGS & SOCIAL LINKS
-- ============================================

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  site_name VARCHAR(100) DEFAULT 'WebCash',
  site_description TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  logo_url TEXT,
  subscription_price DECIMAL(10,2) DEFAULT 1800,
  referral_bonus DECIMAL(10,2) DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (id, site_name, email, phone)
VALUES (1, 'WebCash', 'support@webcash.com', '+237 6XX XXX XXX')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI CHAT LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Products policies
CREATE POLICY "Published products visible to all" ON products FOR SELECT USING (is_published = true OR seller_id = auth.uid());
CREATE POLICY "Sellers can create products" ON products FOR INSERT WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Sellers can update own products" ON products FOR UPDATE USING (seller_id = auth.uid());

-- Wallets policies
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (user_id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (user_id = auth.uid());

-- Wishlists policies
CREATE POLICY "Users can manage own wishlist" ON wishlists FOR ALL USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Support tickets policies
CREATE POLICY "Users can view own tickets" ON support_tickets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment balance function
CREATE OR REPLACE FUNCTION increment_balance(uid UUID, amount DECIMAL)
RETURNS void AS $$
BEGIN
  INSERT INTO wallets (user_id, balance)
  VALUES (uid, amount)
  ON CONFLICT (user_id)
  DO UPDATE SET balance = wallets.balance + amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trust score function
CREATE OR REPLACE FUNCTION update_trust_score(uid UUID)
RETURNS void AS $$
DECLARE
  total_sales_count INTEGER;
  total_earnings_amount DECIMAL;
  new_tier VARCHAR;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(amount), 0)
  INTO total_sales_count, total_earnings_amount
  FROM product_sales WHERE seller_id = uid;
  
  new_tier := CASE
    WHEN total_sales_count >= 100 THEN 'platinum'
    WHEN total_sales_count >= 50 THEN 'gold'
    WHEN total_sales_count >= 20 THEN 'silver'
    WHEN total_sales_count >= 5 THEN 'bronze'
    ELSE 'new'
  END;
  
  UPDATE users SET
    total_sales = total_sales_count,
    total_earnings = total_earnings_amount,
    trust_score = total_sales_count * 10,
    trust_tier = new_tier
  WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
