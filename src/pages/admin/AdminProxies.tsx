import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Card, Button, Input, Select, Badge, Modal, EmptyState } from '../../components/ui';
import { Server, Plus, Edit, Trash2, Search } from 'lucide-react';
import type { Proxy } from '../../types';

export const AdminProxies: React.FC = () => {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProxy, setEditingProxy] = useState<Proxy | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchProxies(); }, [search]);

  const fetchProxies = async () => {
    setLoading(true);
    try {
      let query = supabase.from('proxies').select('*');
      if (search) query = query.ilike('host', `%${search}%`);
      const { data } = await query.order('created_at', { ascending: false });
      setProxies(data || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await supabase.from('proxies').delete().eq('id', id);
    fetchProxies();
  };

  return (
    <MainLayout title="Manage Proxies" showBottomNav={false}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Input placeholder="Search proxies..." value={search} onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-5 h-5" />} className="flex-1 mr-3" />
          <Button onClick={() => { setEditingProxy(null); setShowModal(true); }} icon={<Plus className="w-4 h-4" />}>
            Add Proxy
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-[#1e1e2d] rounded-xl h-20" />)}</div>
        ) : proxies.length > 0 ? (
          <div className="space-y-3">
            {proxies.map(proxy => (
              <Card key={proxy.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <Server className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{proxy.host}:{proxy.port}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="info">{proxy.protocol.toUpperCase()}</Badge>
                        {proxy.country && <span className="text-gray-400 text-xs">{proxy.country}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={proxy.is_active ? 'success' : 'error'}>{proxy.is_active ? 'Active' : 'Inactive'}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingProxy(proxy); setShowModal(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(proxy.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Server className="w-8 h-8" />} title="No Proxies" />
        )}

        <ProxyFormModal isOpen={showModal} onClose={() => setShowModal(false)} proxy={editingProxy}
          onSuccess={() => { setShowModal(false); fetchProxies(); }} />
      </div>
    </MainLayout>
  );
};

const ProxyFormModal: React.FC<{
  isOpen: boolean; onClose: () => void; proxy: Proxy | null; onSuccess: () => void;
}> = ({ isOpen, onClose, proxy, onSuccess }) => {
  const [formData, setFormData] = useState({
    host: '', port: 8080, username: '', password: '', protocol: 'http' as 'http' | 'https' | 'socks4' | 'socks5',
    country: '', is_active: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (proxy) {
      setFormData({
        host: proxy.host, port: proxy.port, username: proxy.username, password: proxy.password,
        protocol: proxy.protocol, country: proxy.country || '', is_active: proxy.is_active
      });
    } else {
      setFormData({ host: '', port: 8080, username: '', password: '', protocol: 'http', country: '', is_active: true });
    }
  }, [proxy]);

  const handleSubmit = async () => {
    if (!formData.host) return;
    setLoading(true);
    try {
      if (proxy) {
        await supabase.from('proxies').update(formData).eq('id', proxy.id);
      } else {
        await supabase.from('proxies').insert(formData);
      }
      onSuccess();
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={proxy ? 'Edit Proxy' : 'Add Proxy'}>
      <div className="space-y-4">
        <Input label="Host" placeholder="Proxy host/IP" value={formData.host}
          onChange={(e) => setFormData({ ...formData, host: e.target.value })} />
        <Input label="Port" type="number" value={formData.port.toString()}
          onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 8080 })} />
        <Input label="Username" placeholder="Auth username" value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
        <Input label="Password" placeholder="Auth password" value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
        <Select label="Protocol" value={formData.protocol}
          onChange={(e) => setFormData({ ...formData, protocol: e.target.value as typeof formData.protocol })}
          options={[
            { value: 'http', label: 'HTTP' },
            { value: 'https', label: 'HTTPS' },
            { value: 'socks4', label: 'SOCKS4' },
            { value: 'socks5', label: 'SOCKS5' }
          ]} />
        <Input label="Country" placeholder="e.g., USA" value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 rounded border-gray-600 bg-[#1e1e2d] text-indigo-600" />
          <span className="text-gray-300">Active</span>
        </label>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">{proxy ? 'Update' : 'Create'}</Button>
        </div>
      </div>
    </Modal>
  );
};
