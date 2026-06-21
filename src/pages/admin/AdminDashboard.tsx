import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { supabase } from '../../lib/supabase';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Card, Badge } from '../../components/ui';
import {
  Users,
  BookOpen,
  Package,
  Server,
  CreditCard,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Bell,
  Settings
} from 'lucide-react';
import type { AdminStats } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { isAdmin } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    active_users: 0,
    total_revenue: 0,
    pending_payments: 0,
    open_tickets: 0,
    total_courses: 0,
    total_products: 0,
    total_accounts: 0
  });
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchStats();
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const [
        usersCount,
        activeUsersCount,
        paymentsData,
        pendingPayments,
        openTickets,
        coursesCount,
        productsCount,
        accountsCount
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('subscription_active', true),
        supabase.from('payments').select('amount').eq('status', 'success'),
        supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('digital_products').select('id', { count: 'exact', head: true }),
        supabase.from('accounts').select('id', { count: 'exact', head: true })
      ]);

      const totalRevenue = paymentsData.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      setStats({
        total_users: usersCount.count || 0,
        active_users: activeUsersCount.count || 0,
        total_revenue: totalRevenue,
        pending_payments: pendingPayments.count || 0,
        open_tickets: openTickets.count || 0,
        total_courses: coursesCount.count || 0,
        total_products: productsCount.count || 0,
        total_accounts: accountsCount.count || 0
      });
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: 'Manage Users', icon: Users, path: '/admin/users', color: 'from-blue-500 to-cyan-500' },
    { label: 'Courses', icon: BookOpen, path: '/admin/courses', color: 'from-purple-500 to-pink-500' },
    { label: 'Products', icon: Package, path: '/admin/products', color: 'from-orange-500 to-red-500' },
    { label: 'Accounts', icon: Server, path: '/admin/accounts', color: 'from-green-500 to-emerald-500' },
    { label: 'Payments', icon: CreditCard, path: '/admin/payments', color: 'from-indigo-500 to-violet-500' },
    { label: 'Support', icon: MessageSquare, path: '/admin/tickets', color: 'from-yellow-500 to-orange-500' },
    { label: 'Notifications', icon: Bell, path: '/admin/notifications', color: 'from-pink-500 to-rose-500' },
    { label: 'Settings', icon: Settings, path: '/admin/settings', color: 'from-gray-500 to-slate-500' },
  ];

  return (
    <MainLayout title="Admin Dashboard" showBottomNav={false}>
      <div className="p-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400 text-xs">Total Users</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total_users}</p>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-xs">Active</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.active_users}</p>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-400 text-xs">Revenue</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total_revenue.toLocaleString()}</p>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-orange-400" />
              <span className="text-gray-400 text-xs">Open Tickets</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.open_tickets}</p>
          </Card>
        </div>

        {/* Content Stats */}
        <Card>
          <h3 className="text-white font-semibold mb-4">Content Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-white font-bold">{stats.total_courses}</p>
              <p className="text-gray-400 text-xs">Courses</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Package className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-white font-bold">{stats.total_products}</p>
              <p className="text-gray-400 text-xs">Products</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Server className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-white font-bold">{stats.total_accounts}</p>
              <p className="text-gray-400 text-xs">Accounts</p>
            </div>
          </div>
        </Card>

        {/* Pending Items */}
        {(stats.pending_payments > 0 || stats.open_tickets > 0) && (
          <Card className="border-yellow-500/30">
            <h3 className="text-white font-semibold mb-3">Attention Required</h3>
            <div className="space-y-2">
              {stats.pending_payments > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Pending Payments</span>
                  <Badge variant="warning">{stats.pending_payments}</Badge>
                </div>
              )}
              {stats.open_tickets > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Open Support Tickets</span>
                  <Badge variant="warning">{stats.open_tickets}</Badge>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Card
                  key={idx}
                  hover
                  onClick={() => navigate(action.path)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-medium text-sm">{action.label}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
