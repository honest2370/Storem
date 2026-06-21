import React, { useEffect, useState } from 'react';
import { useApp } from '../../store/AppContext';
import { supabase } from '../../lib/supabase';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Card, Button, Input, Badge, Modal, Tabs, EmptyState } from '../../components/ui';
import { Users, Search, Ban, CheckCircle, Clock, UserX, UserCheck, MoreVertical, Shield } from 'lucide-react';
import type { User } from '../../types';

export const AdminUsers: React.FC = () => {
  const { isAdmin } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin, activeTab, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('users').select('*');
      
      if (search) {
        query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%`);
      }

      switch (activeTab) {
        case 'active':
          query = query.eq('subscription_active', true);
          break;
        case 'banned':
          query = query.eq('is_banned', true);
          break;
        case 'suspended':
          query = query.eq('is_suspended', true);
          break;
      }
      
      const { data } = await query.order('created_at', { ascending: false });
      setUsers(data || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!selectedUser) return;
    setActionLoading(true);

    try {
      const updates: Record<string, boolean> = {};
      
      switch (action) {
        case 'ban':
          updates.is_banned = true;
          break;
        case 'unban':
          updates.is_banned = false;
          break;
        case 'suspend':
          updates.is_suspended = true;
          break;
        case 'unsuspend':
          updates.is_suspended = false;
          break;
        case 'activate':
          updates.subscription_active = true;
          break;
        case 'deactivate':
          updates.subscription_active = false;
          break;
      }

      await supabase
        .from('users')
        .update(updates)
        .eq('id', selectedUser.id);

      setShowModal(false);
      fetchUsers();
    } catch {
      // Handle error
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.is_banned) return <Badge variant="error">Banned</Badge>;
    if (user.is_suspended) return <Badge variant="warning">Suspended</Badge>;
    if (user.subscription_active) return <Badge variant="success">Active</Badge>;
    return <Badge variant="default">Inactive</Badge>;
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'banned', label: 'Banned' },
    { id: 'suspended', label: 'Suspended' },
  ];

  return (
    <MainLayout title="Manage Users" showBottomNav={false}>
      <div className="p-4 space-y-4">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />

        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card padding="sm">
            <p className="text-white font-bold text-lg">{users.length}</p>
            <p className="text-gray-400 text-xs">Total</p>
          </Card>
          <Card padding="sm">
            <p className="text-green-400 font-bold text-lg">{users.filter(u => u.subscription_active).length}</p>
            <p className="text-gray-400 text-xs">Active</p>
          </Card>
          <Card padding="sm">
            <p className="text-red-400 font-bold text-lg">{users.filter(u => u.is_banned).length}</p>
            <p className="text-gray-400 text-xs">Banned</p>
          </Card>
          <Card padding="sm">
            <p className="text-yellow-400 font-bold text-lg">{users.filter(u => u.is_suspended).length}</p>
            <p className="text-gray-400 text-xs">Suspended</p>
          </Card>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-[#1e1e2d] rounded-xl h-20" />
            ))}
          </div>
        ) : users.length > 0 ? (
          <div className="space-y-3">
            {users.map(user => (
              <Card
                key={user.id}
                hover
                onClick={() => {
                  setSelectedUser(user);
                  setShowModal(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.username}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(user)}
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Users className="w-8 h-8" />} title="No Users Found" />
        )}

        {/* User Actions Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="User Actions"
          size="lg"
        >
          {selectedUser && (
            <div className="space-y-4">
              <Card padding="sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {selectedUser.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{selectedUser.username}</p>
                    <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                    {getStatusBadge(selectedUser)}
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-2">
                {selectedUser.is_banned ? (
                  <Button
                    variant="outline"
                    onClick={() => handleAction('unban')}
                    loading={actionLoading}
                    icon={<UserCheck className="w-4 h-4" />}
                  >
                    Unban User
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={() => handleAction('ban')}
                    loading={actionLoading}
                    icon={<Ban className="w-4 h-4" />}
                  >
                    Ban User
                  </Button>
                )}

                {selectedUser.is_suspended ? (
                  <Button
                    variant="outline"
                    onClick={() => handleAction('unsuspend')}
                    loading={actionLoading}
                    icon={<CheckCircle className="w-4 h-4" />}
                  >
                    Unsuspend
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => handleAction('suspend')}
                    loading={actionLoading}
                    icon={<Clock className="w-4 h-4" />}
                  >
                    Suspend
                  </Button>
                )}

                {selectedUser.subscription_active ? (
                  <Button
                    variant="secondary"
                    onClick={() => handleAction('deactivate')}
                    loading={actionLoading}
                    icon={<UserX className="w-4 h-4" />}
                  >
                    Deactivate Sub
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => handleAction('activate')}
                    loading={actionLoading}
                    icon={<Shield className="w-4 h-4" />}
                  >
                    Activate Sub
                  </Button>
                )}
              </div>

              <div className="text-xs text-gray-500">
                <p>User ID: {selectedUser.id}</p>
                <p>Created: {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                {selectedUser.subscription_expires_at && (
                  <p>Sub Expires: {new Date(selectedUser.subscription_expires_at).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
};
