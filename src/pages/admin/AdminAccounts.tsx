import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState } from '../../components/ui';
import { Server, Plus, Edit, Trash2, Search, Play, User, Monitor } from 'lucide-react';
import type { Account } from '../../types';

export const AdminAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, [search]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('accounts').select('*');
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await supabase.from('accounts').delete().eq('id', id);
    fetchAccounts();
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'streaming': return Play;
      case 'iptv': return Monitor;
      default: return User;
    }
  };

  return (
    <MainLayout title="Manage Accounts" showBottomNav={false}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-5 h-5" />}
            className="flex-1 mr-3"
          />
          <Button onClick={() => { setEditingAccount(null); setShowModal(true); }} icon={<Plus className="w-4 h-4" />}>
            Add Account
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse bg-[#1e1e2d] rounded-xl h-32" />)}
          </div>
        ) : accounts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {accounts.map(account => {
              const Icon = getServiceIcon(account.service_type);
              return (
                <Card key={account.id}>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-medium text-sm">{account.service_name}</h3>
                    <div className="flex justify-center gap-1 mt-1">
                      <Badge variant={account.is_active ? 'success' : 'error'} className="text-xs">
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="info" className="text-xs">
                        {account.available_slots}/{account.max_slots}
                      </Badge>
                    </div>
                    <div className="flex justify-center gap-2 mt-3">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingAccount(account); setShowModal(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(account.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={<Server className="w-8 h-8" />} title="No Accounts" />
        )}

        <AccountFormModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          account={editingAccount}
          onSuccess={() => { setShowModal(false); fetchAccounts(); }}
        />
      </div>
    </MainLayout>
  );
};

const AccountFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  onSuccess: () => void;
}> = ({ isOpen, onClose, account, onSuccess }) => {
  const [formData, setFormData] = useState({
    service_name: '',
    service_type: 'streaming',
    login_email: '',
    login_password: '',
    additional_info: '',
    expiry_date: '',
    max_slots: 1,
    available_slots: 1,
    is_multi_user: false,
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      setFormData({
        service_name: account.service_name,
        service_type: account.service_type,
        login_email: account.login_email,
        login_password: account.login_password,
        additional_info: account.additional_info || '',
        expiry_date: account.expiry_date?.split('T')[0] || '',
        max_slots: account.max_slots,
        available_slots: account.available_slots,
        is_multi_user: account.is_multi_user,
        is_active: account.is_active
      });
    } else {
      setFormData({
        service_name: '', service_type: 'streaming', login_email: '', login_password: '',
        additional_info: '', expiry_date: '', max_slots: 1, available_slots: 1,
        is_multi_user: false, is_active: true
      });
    }
  }, [account]);

  const handleSubmit = async () => {
    if (!formData.service_name || !formData.login_email || !formData.login_password) return;
    setLoading(true);

    try {
      const data = {
        ...formData,
        expiry_date: formData.expiry_date || null
      };

      if (account) {
        await supabase.from('accounts').update(data).eq('id', account.id);
      } else {
        await supabase.from('accounts').insert(data);
      }
      onSuccess();
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={account ? 'Edit Account' : 'Add Account'} size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <Input label="Service Name" placeholder="e.g., Netflix Premium" value={formData.service_name}
          onChange={(e) => setFormData({ ...formData, service_name: e.target.value })} />
        
        <Select label="Service Type" value={formData.service_type}
          onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
          options={[
            { value: 'streaming', label: 'Streaming' },
            { value: 'social', label: 'Social Media' },
            { value: 'iptv', label: 'IPTV' },
            { value: 'gaming', label: 'Gaming' },
            { value: 'other', label: 'Other' }
          ]} />

        <Input label="Login Email/Username" placeholder="Email or username" value={formData.login_email}
          onChange={(e) => setFormData({ ...formData, login_email: e.target.value })} />

        <Input label="Password" placeholder="Account password" value={formData.login_password}
          onChange={(e) => setFormData({ ...formData, login_password: e.target.value })} />

        <Textarea label="Additional Info" placeholder="Any extra details..." value={formData.additional_info}
          onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })} rows={2} />

        <Input label="Expiry Date" type="date" value={formData.expiry_date}
          onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Max Slots" type="number" value={formData.max_slots.toString()}
            onChange={(e) => setFormData({ ...formData, max_slots: parseInt(e.target.value) || 1 })} />
          <Input label="Available Slots" type="number" value={formData.available_slots.toString()}
            onChange={(e) => setFormData({ ...formData, available_slots: parseInt(e.target.value) || 1 })} />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.is_multi_user}
              onChange={(e) => setFormData({ ...formData, is_multi_user: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-[#1e1e2d] text-indigo-600" />
            <span className="text-gray-300 text-sm">Multi-User</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-[#1e1e2d] text-indigo-600" />
            <span className="text-gray-300 text-sm">Active</span>
          </label>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">{account ? 'Update' : 'Create'}</Button>
        </div>
      </div>
    </Modal>
  );
};
