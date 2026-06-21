export interface User {
  id: string;
  email: string;
  username: string;
  phone?: string;
  country?: string;
  avatar_url?: string;
  is_active: boolean;
  is_banned: boolean;
  is_suspended: boolean;
  subscription_active: boolean;
  subscription_expires_at?: string;
  daily_slot_used: boolean;
  last_slot_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  category: string;
  instructor?: string;
  duration?: string;
  lessons_count?: number;
  price?: number;
  upload_type: 'manual' | 'link';
  content_url?: string;
  files?: CourseFile[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface DigitalProduct {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  category: string;
  price?: number;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  is_published: boolean;
  created_at: string;
}

export interface Account {
  id: string;
  service_name: string;
  service_type: 'streaming' | 'social' | 'iptv' | 'gaming' | 'other';
  login_email: string;
  login_password: string;
  additional_info?: string;
  expiry_date?: string;
  max_slots: number;
  available_slots: number;
  is_multi_user: boolean;
  is_active: boolean;
  created_at: string;
}

export interface UserAccount {
  id: string;
  user_id: string;
  account_id: string;
  claimed_at: string;
  expires_at?: string;
}

export interface Proxy {
  id: string;
  host: string;
  port: number;
  username: string;
  password: string;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  country?: string;
  is_active: boolean;
  created_at: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  content: string;
  thumbnail_url?: string;
  category: string;
  video_url?: string;
  files?: CourseFile[];
  is_published: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  message: string;
  attachments?: CourseFile[];
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export interface Podcast {
  id: string;
  title: string;
  description: string;
  audio_url: string;
  thumbnail_url?: string;
  duration?: string;
  created_at: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon?: string;
  display_order: number;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  transaction_id: string;
  provider: string;
  phone: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  total_revenue: number;
  pending_payments: number;
  open_tickets: number;
  total_courses: number;
  total_products: number;
  total_accounts: number;
}
