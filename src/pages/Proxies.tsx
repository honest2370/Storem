import React, { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { MainLayout } from '../components/Layout/MainLayout';
import { Card, Button, Badge, Input, EmptyState, Modal } from '../components/ui';
import { Server, Search, Lock, Copy, CheckCircle, Globe, Shield, Zap } from 'lucide-react';
import type { Proxy } from '../types';

export const Proxies: React.FC = () => {
  const { user } = useApp();
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProxy, setSelectedProxy] = useState<Proxy | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetchProxies();
  }, [search]);

  const fetchProxies = async () => {
    setLoading(true);
    try {
      let query = supabase.from('proxies').select('*').eq('is_active', true);
      
      if (search) {
        query = query.or(`host.ilike.%${search}%,country.ilike.%${search}%`);
      }
      
      const { data } = await query.order('created_at', { ascending: false });
      setProxies(data || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  const getProxyString = (proxy: Proxy) => {
    return `${proxy.protocol}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
  };

  if (!user?.subscription_active) {
    return (
      <MainLayout title="Proxies">
        <div className="p-4">
          <Card className="text-center py-12">
            <Lock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Subscription Required</h2>
            <Button onClick={() => window.location.href = '/payment'}>Activate Now</Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Proxies">
      <div className="p-4 space-y-4">
        <Input
          placeholder="Search proxies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card padding="sm">
            <div className="text-center">
              <Globe className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
              <p className="text-white font-bold">{proxies.length}</p>
              <p className="text-gray-400 text-xs">Total</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <Shield className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-white font-bold">{proxies.filter(p => p.protocol === 'https').length}</p>
              <p className="text-gray-400 text-xs">HTTPS</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-white font-bold">{proxies.filter(p => p.protocol === 'socks5').length}</p>
              <p className="text-gray-400 text-xs">SOCKS5</p>
            </div>
          </Card>
        </div>

        {/* Proxy List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-[#1e1e2d] rounded-xl h-20" />
            ))}
          </div>
        ) : proxies.length > 0 ? (
          <div className="space-y-3">
            {proxies.map(proxy => (
              <Card
                key={proxy.id}
                hover
                onClick={() => {
                  setSelectedProxy(proxy);
                  setShowModal(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Server className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{proxy.host}:{proxy.port}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="info">{proxy.protocol.toUpperCase()}</Badge>
                        {proxy.country && (
                          <span className="text-gray-400 text-xs">{proxy.country}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(getProxyString(proxy), 'full');
                    }}
                  >
                    {copied === 'full' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Server className="w-8 h-8" />} title="No Proxies Available" />
        )}

        {/* Proxy Details Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Proxy Details"
          size="lg"
        >
          {selectedProxy && (
            <div className="space-y-4">
              <div className="bg-[#1e1e2d] rounded-xl p-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Host</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-white bg-[#0d0d12] px-3 py-2 rounded-lg text-sm">
                      {selectedProxy.host}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(selectedProxy.host, 'host')}
                    >
                      {copied === 'host' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Port</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-white bg-[#0d0d12] px-3 py-2 rounded-lg text-sm">
                      {selectedProxy.port}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(String(selectedProxy.port), 'port')}
                    >
                      {copied === 'port' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Username</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-white bg-[#0d0d12] px-3 py-2 rounded-lg text-sm">
                      {selectedProxy.username}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(selectedProxy.username, 'user')}
                    >
                      {copied === 'user' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Password</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-white bg-[#0d0d12] px-3 py-2 rounded-lg text-sm">
                      {selectedProxy.password}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(selectedProxy.password, 'pass')}
                    >
                      {copied === 'pass' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

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
