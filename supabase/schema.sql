-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  country VARCHAR(10),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT true,
  is_banned BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  subscription_active BOOLEAN DEFAULT false,
  subscription_expires_at TIMESTAMPTZ,
  daily_slot_used BOOLEAN DEFAULT false,
  last_slot_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_subscription ON users(subscription_active);

-- ============================================
-- COURSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category VARCHAR(50) NOT NULL,
  instructor VARCHAR(100),
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

-- ============================================
-- DIGITAL PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS digital_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  file_url TEXT,
  file_name VARCHAR(255),
  file_size BIGINT DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON digital_products(category);
CREATE INDEX idx_products_published ON digital_products(is_published);

-- ============================================
-- ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX idx_accounts_type ON accounts(service_type);
CREATE INDEX idx_accounts_active ON accounts(is_active);
CREATE INDEX idx_accounts_slots ON accounts(available_slots);

-- ============================================
-- USER ACCOUNTS TABLE (Claims)
-- ============================================
CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, account_id)
);

CREATE INDEX idx_user_accounts_user ON user_accounts(user_id);
CREATE INDEX idx_user_accounts_account ON user_accounts(account_id);

-- ============================================
-- PROXIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS proxies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL,
  username VARCHAR(100),
  password VARCHAR(100),
  protocol VARCHAR(10) DEFAULT 'http' CHECK (protocol IN ('http', 'https', 'socks4', 'socks5')),
  country VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proxies_active ON proxies(is_active);
CREATE INDEX idx_proxies_protocol ON proxies(protocol);

-- ============================================
-- TUTORIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tutorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  thumbnail_url TEXT,
  category VARCHAR(50) NOT NULL,
  video_url TEXT,
  files JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tutorials_category ON tutorials(category);
CREATE INDEX idx_tutorials_published ON tutorials(is_published);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'XAF',
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  provider VARCHAR(50),
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);

-- ============================================
-- SUPPORT TICKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);

-- ============================================
-- TICKET MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id VARCHAR(100) NOT NULL,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_ticket ON ticket_messages(ticket_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- ============================================
-- PODCASTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOCIAL LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_links_order ON social_links(display_order);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  site_name VARCHAR(100) DEFAULT 'WebCash',
  site_description TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (id, site_name, email, phone)
VALUES (1, 'WebCash', 'support@webcash.com', '+237 6XX XXX XXX')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Courses policies (published visible to all, all visible to admin)
CREATE POLICY "Published courses visible to all" ON courses
  FOR SELECT USING (is_published = true OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Digital products policies
CREATE POLICY "Published products visible to all" ON digital_products
  FOR SELECT USING (is_published = true OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage products" ON digital_products
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Accounts policies
CREATE POLICY "Active accounts visible to subscribed users" ON accounts
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND (subscription_active = true OR role = 'admin')
    )
  );

CREATE POLICY "Admins can manage accounts" ON accounts
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- User accounts policies
CREATE POLICY "Users can view own claimed accounts" ON user_accounts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can claim accounts" ON user_accounts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Proxies policies
CREATE POLICY "Proxies visible to subscribed users" ON proxies
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND (subscription_active = true OR role = 'admin')
    )
  );

CREATE POLICY "Admins can manage proxies" ON proxies
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Tutorials policies
CREATE POLICY "Published tutorials visible to all" ON tutorials
  FOR SELECT USING (is_published = true OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage tutorials" ON tutorials
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create payments" ON payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Support tickets policies
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tickets" ON support_tickets
  FOR UPDATE USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Ticket messages policies
CREATE POLICY "Users can view messages in their tickets" ON ticket_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM support_tickets WHERE id = ticket_id AND (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ))
  ));

CREATE POLICY "Users can add messages to their tickets" ON ticket_messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Podcasts policies
CREATE POLICY "Podcasts visible to all" ON podcasts
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage podcasts" ON podcasts
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Social links policies
CREATE POLICY "Social links visible to all" ON social_links
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage social links" ON social_links
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Settings policies
CREATE POLICY "Settings visible to all" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON settings
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_digital_products_updated_at BEFORE UPDATE ON digital_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proxies_updated_at BEFORE UPDATE ON proxies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutorials_updated_at BEFORE UPDATE ON tutorials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION check_subscription(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND subscription_active = true 
    AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset daily slots (call via cron or manually)
CREATE OR REPLACE FUNCTION reset_daily_slots()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET daily_slot_used = false, last_slot_date = CURRENT_DATE
  WHERE last_slot_date IS NULL OR last_slot_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEWS FOR DASHBOARD STATS
-- ============================================

CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE subscription_active = true) as active_users,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'success') as total_revenue,
  (SELECT COUNT(*) FROM payments WHERE status = 'pending') as pending_payments,
  (SELECT COUNT(*) FROM support_tickets WHERE status = 'open') as open_tickets,
  (SELECT COUNT(*) FROM courses) as total_courses,
  (SELECT COUNT(*) FROM digital_products) as total_products,
  (SELECT COUNT(*) FROM accounts) as total_accounts;

-- ============================================
-- SAMPLE DATA (Optional - Remove in production)
-- ============================================

-- Insert sample courses
INSERT INTO courses (title, description, category, instructor, duration, lessons_count, upload_type, is_published) VALUES
('Complete Web Development', 'Learn HTML, CSS, JavaScript and more', 'programming', 'John Doe', '40 hours', 120, 'link', true),
('Digital Marketing Mastery', 'Master digital marketing strategies', 'marketing', 'Jane Smith', '20 hours', 60, 'manual', true),
('UI/UX Design Fundamentals', 'Learn design principles and tools', 'design', 'Mike Johnson', '15 hours', 45, 'link', true);

-- Insert sample accounts
INSERT INTO accounts (service_name, service_type, login_email, login_password, max_slots, available_slots, is_multi_user, is_active) VALUES
('Netflix Premium', 'streaming', 'netflix@webcash.com', 'netflix123', 100, 100, true, true),
('Spotify Premium', 'streaming', 'spotify@webcash.com', 'spotify123', 100, 100, true, true),
('IPTV Premium', 'iptv', 'iptv@webcash.com', 'iptv123', 5, 5, false, true);

-- Insert sample proxies
INSERT INTO proxies (host, port, username, password, protocol, country, is_active) VALUES
('proxy1.webcash.com', 8080, 'user1', 'pass1', 'http', 'USA', true),
('proxy2.webcash.com', 8080, 'user2', 'pass2', 'https', 'Germany', true),
('proxy3.webcash.com', 1080, 'user3', 'pass3', 'socks5', 'France', true);

-- Insert sample digital products
INSERT INTO digital_products (title, description, category, is_published) VALUES
('Website Templates Pack', '50+ premium website templates', 'templates', true),
('E-Book: Business Growth', 'Complete guide to business growth', 'ebooks', true),
('Graphic Design Assets', '1000+ design assets', 'graphics', true);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to anon users (for public content)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON courses TO anon;
GRANT SELECT ON digital_products TO anon;
GRANT SELECT ON tutorials TO anon;
GRANT SELECT ON podcasts TO anon;
GRANT SELECT ON social_links TO anon;
GRANT SELECT ON settings TO anon;

-- ============================================
-- STORAGE BUCKETS (Run in Supabase Dashboard)
-- ============================================

/*
-- Create storage buckets in Supabase Dashboard:

1. course-files - For course materials
2. product-files - For digital product files
3. avatars - For user avatars
4. ticket-attachments - For support ticket attachments
5. podcast-audio - For podcast audio files

-- Storage policies (run in SQL editor):

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public to view avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow admins to manage course files
CREATE POLICY "Admins can manage course files"
ON storage.objects FOR ALL
USING (bucket_id = 'course-files' AND is_admin());

-- Allow subscribed users to download course files
CREATE POLICY "Subscribed users can download course files"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-files' AND check_subscription(auth.uid()));

-- Allow admins to manage product files
CREATE POLICY "Admins can manage product files"
ON storage.objects FOR ALL
USING (bucket_id = 'product-files' AND is_admin());

-- Allow subscribed users to download product files
CREATE POLICY "Subscribed users can download product files"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-files' AND check_subscription(auth.uid()));

-- Allow users to upload ticket attachments
CREATE POLICY "Users can upload ticket attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ticket-attachments' AND auth.role() = 'authenticated');

-- Allow users to view their ticket attachments
CREATE POLICY "Users can view ticket attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'ticket-attachments' AND auth.role() = 'authenticated');

-- Allow admins to manage podcast audio
CREATE POLICY "Admins can manage podcast audio"
ON storage.objects FOR ALL
USING (bucket_id = 'podcast-audio' AND is_admin());

-- Allow public to listen to podcasts
CREATE POLICY "Podcast audio is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'podcast-audio');
*/

-- End of schema
