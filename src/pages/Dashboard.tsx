import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { MainLayout } from '../components/Layout/MainLayout';
import { Card, Button, Badge, Progress } from '../components/ui';
import {
  BookOpen,
  Package,
  Play,
  Server,
  FileText,
  Clock,
  ChevronRight,
  AlertTriangle,
  Crown,
  Zap
} from 'lucide-react';
import type { Course, DigitalProduct, Account } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<DigitalProduct[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, productsRes, accountsRes] = await Promise.all([
          supabase.from('courses').select('*').eq('is_published', true).limit(3),
          supabase.from('digital_products').select('*').eq('is_published', true).limit(3),
          supabase.from('accounts').select('*').eq('is_active', true).gt('available_slots', 0).limit(3)
        ]);

        setRecentCourses(coursesRes.data || []);
        setFeaturedProducts(productsRes.data || []);
        setAvailableAccounts(accountsRes.data || []);
      } catch {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const daysRemaining = user?.subscription_expires_at
    ? Math.max(0, Math.ceil((new Date(user.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (!user?.subscription_active) {
    return (
      <MainLayout title="Dashboard">
        <div className="p-4">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center mb-6">
              <Crown className="w-10 h-10 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Activate Your Account</h1>
            <p className="text-gray-400 mb-6 max-w-sm">
              Complete your payment to unlock access to all premium content
            </p>
            <Button size="lg" onClick={() => navigate('/payment')}>
              Pay Now - 1800 XAF
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard">
      <div className="p-4 space-y-6">
        {/* Subscription Status */}
        <Card className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Premium Active</p>
                <p className="text-gray-400 text-sm">{daysRemaining} days remaining</p>
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <div className="mt-4">
            <Progress value={daysRemaining} max={30} />
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Courses', value: '12', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
            { label: 'Products', value: '8', icon: Package, color: 'from-purple-500 to-pink-500' },
            { label: 'Accounts', value: '5', icon: Play, color: 'from-orange-500 to-red-500' },
            { label: 'Proxies', value: '20+', icon: Server, color: 'from-green-500 to-emerald-500' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} padding="sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-gray-400 text-xs">{stat.label}</p>
              </Card>
            );
          })}
        </div>

        {/* Daily Slot Status */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-medium">Daily Slot</p>
                <p className="text-gray-400 text-sm">
                  {user?.daily_slot_used ? 'Already claimed today' : '1 slot available'}
                </p>
              </div>
            </div>
            <Badge variant={user?.daily_slot_used ? 'warning' : 'success'}>
              {user?.daily_slot_used ? 'Used' : 'Available'}
            </Badge>
          </div>
        </Card>

        {/* Recent Courses */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Recent Courses</h2>
            <button
              onClick={() => navigate('/courses')}
              className="text-indigo-400 text-sm flex items-center gap-1 hover:text-indigo-300"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-[#1e1e2d] rounded-xl h-24" />
              ))}
            </div>
          ) : recentCourses.length > 0 ? (
            <div className="grid gap-3">
              {recentCourses.map(course => (
                <Card
                  key={course.id}
                  hover
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-[#1e1e2d] rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{course.title}</h3>
                      <p className="text-gray-400 text-sm truncate">{course.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {course.duration && (
                          <span className="text-xs text-gray-500">{course.duration}</span>
                        )}
                        {course.lessons_count && (
                          <span className="text-xs text-gray-500">{course.lessons_count} lessons</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-gray-400 text-center py-4">No courses available</p>
            </Card>
          )}
        </section>

        {/* Featured Products */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Digital Products</h2>
            <button
              onClick={() => navigate('/products')}
              className="text-indigo-400 text-sm flex items-center gap-1 hover:text-indigo-300"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse bg-[#1e1e2d] rounded-xl h-32" />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {featuredProducts.map(product => (
                <Card
                  key={product.id}
                  hover
                  padding="sm"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <div className="w-full aspect-video bg-[#1e1e2d] rounded-lg mb-2 flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-white font-medium text-sm truncate">{product.title}</h3>
                  <p className="text-gray-400 text-xs truncate">{product.category}</p>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-gray-400 text-center py-4">No products available</p>
            </Card>
          )}
        </section>

        {/* Available Accounts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Available Accounts</h2>
            <button
              onClick={() => navigate('/accounts')}
              className="text-indigo-400 text-sm flex items-center gap-1 hover:text-indigo-300"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-[#1e1e2d] rounded-xl w-36 h-24 flex-shrink-0" />
              ))}
            </div>
          ) : availableAccounts.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {availableAccounts.map(account => (
                <Card
                  key={account.id}
                  hover
                  padding="sm"
                  className="flex-shrink-0 w-36"
                  onClick={() => navigate('/accounts')}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg mb-2 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-medium text-sm truncate">{account.service_name}</h3>
                  <p className="text-xs text-gray-400">{account.available_slots} slots</p>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-gray-400 text-center py-4">No accounts available</p>
            </Card>
          )}
        </section>

        {/* Quick Access */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Tutorials', icon: FileText, path: '/tutorials', color: 'from-blue-500 to-indigo-500' },
              { label: 'Proxies', icon: Server, path: '/proxies', color: 'from-green-500 to-emerald-500' },
              { label: 'Support', icon: AlertTriangle, path: '/support', color: 'from-orange-500 to-yellow-500' },
              { label: 'My Wallet', icon: Clock, path: '/wallet', color: 'from-purple-500 to-pink-500' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card
                  key={idx}
                  hover
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-medium">{item.label}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};
