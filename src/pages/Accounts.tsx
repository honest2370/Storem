import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { MainLayout } from '../components/Layout/MainLayout';
import { Card, Button, Badge, Input, Tabs, Modal, EmptyState } from '../components/ui';
import {
  Play,
  Search,
  Lock,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  Clock,
  User,
  Monitor
} from 'lucide-react';
import type { Account } from '../types';

const accountTypes = [
  { id: 'all', label: 'All' },
  { id: 'streaming', label: 'Streaming' },
  { id: 'social', label: 'Social' },
  { id: 'iptv', label: 'IPTV' },
  { id: 'gaming', label: 'Gaming' },
];

export const Accounts: React.FC = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [activeType, search]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('accounts').select('*').eq('is_active', true);
      
      if (activeType !== 'all') {
        query = query.eq('service_type', activeType);
      }
      
      if (search) {
        query = query.ilike('service_name', `%${search}%`);
      }
      
      const { data } = await query.order('created_at', { ascending: false });
      setAccounts(data || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const claimAccount = async (account: Account) => {
    if (!user) return;

    // Check if user already claimed today
    if (user.daily_slot_used && !account.is_multi_user) {
      return;
    }

    try {
      // For multi-user accounts, just show credentials
      if (account.is_multi_user) {
        setSelectedAccount(account);
        setShowModal(true);
        return;
      }

      // For single-user accounts, claim a slot
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ available_slots: account.available_slots - 1 })
        .eq('id', account.id);

      if (updateError) throw updateError;

      // Record the claim
      await supabase.from('user_accounts').insert({
        user_id: user.id,
        account_id: account.id
      });

      // Update user's daily slot
      await supabase
        .from('users')
        .update({ daily_slot_used: true, last_slot_date: new Date().toISOString().split('T')[0] })
        .eq('id', user.id);

      setSelectedAccount(account);
      setShowModal(true);
      fetchAccounts();
    } catch {
      // Handle error
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canAccess = (account: Account) => {
    if (account.is_multi_user) return true;
    return !user?.daily_slot_used && account.available_slots > 0;
  };

  if (!user?.subscription_active) {
    return (
      <MainLayout title="Accounts">
        <div className="p-4">
          <Card className="text-center py-12">
            <Lock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Subscription Required</h2>
            <p className="text-gray-400 mb-4">Please activate your subscription to access accounts</p>
            <Button onClick={() => navigate('/payment')}>Activate Now</Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Accounts">
      <div className="p-4 space-y-4">
        {/* Search */}
        <Input
          placeholder="Search accounts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />

        {/* Types */}
        <Tabs
          tabs={accountTypes.map(t => ({ id: t.id, label: t.label }))}
          activeTab={activeType}
          onTabChange={setActiveType}
        />

        {/* Daily Slot Info */}
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-white text-sm font-medium">Daily Slot Status</p>
              <p className="text-yellow-400 text-xs">
                {user?.daily_slot_used ? 'You have used your slot today' : '1 slot available for single-user accounts'}
              </p>
            </div>
          </div>
        </Card>

        {/* Accounts Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse bg-[#1e1e2d] rounded-xl h-32" />
            ))}
          </div>
        ) : accounts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {accounts.map(account => (
              <Card
                key={account.id}
                hover
                onClick={() => canAccess(account) && claimAccount(account)}
                className={!canAccess(account) ? 'opacity-50' : ''}
              >
                <div className="text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    {account.service_type === 'streaming' ? (
                      <Play className="w-7 h-7 text-white" />
                    ) : account.service_type === 'iptv' ? (
                      <Monitor className="w-7 h-7 text-white" />
                    ) : (
                      <User className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{account.service_name}</h3>
                  <Badge variant={account.is_multi_user ? 'success' : 'info'} className="text-xs">
                    {account.is_multi_user ? 'Multi-User' : `${account.available_slots} slots`}
                  </Badge>
                  {!canAccess(account) && !account.is_multi_user && (
                    <p className="text-red-400 text-xs mt-2">Unavailable</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Play className="w-8 h-8" />}
            title="No Accounts Available"
          />
        )}

        {/* Account Details Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedAccount?.service_name}
          size="lg"
        >
          {selectedAccount && (
            <div className="space-y-4">
              <div className="bg-[#1e1e2d] rounded-xl p-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Email / Username</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-white bg-[#0d0d12] px-3 py-2 rounded-lg text-sm">
                      {selectedAccount.login_email}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(selectedAccount.login_email)}
                    >
                      {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Password</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-white bg-[#0d0d12] px-3 py-2 rounded-lg text-sm">
                      {showPassword ? selectedAccount.login_password : '••••••••'}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(selectedAccount.login_password)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {selectedAccount.additional_info && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Additional Info</label>
                    <p className="text-white text-sm">{selectedAccount.additional_info}</p>
                  </div>
                )}
              </div>

              {selectedAccount.expiry_date && (
                <p className="text-gray-400 text-sm">
                  Expires: {new Date(selectedAccount.expiry_date).toLocaleDateString()}
                </p>
              )}

              <Button onClick={() => setShowModal(false)} className="w-full">
                Done
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
};
