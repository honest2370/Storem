import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Card, Button, Input, Textarea } from '../../components/ui';
import { Save, Link, Mail, Phone, ExternalLink } from 'lucide-react';
import type { SocialLink } from '../../types';

export const AdminSettings: React.FC = () => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newLink, setNewLink] = useState({ platform: '', url: '' });
  const [contactInfo, setContactInfo] = useState({ email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('social_links').select('*').order('display_order');
    setSocialLinks(data || []);
    
    const { data: settings } = await supabase.from('settings').select('*').single();
    if (settings) setContactInfo({ email: settings.email || '', phone: settings.phone || '', address: settings.address || '' });
  };

  const addSocialLink = async () => {
    if (!newLink.platform || !newLink.url) return;
    await supabase.from('social_links').insert({ ...newLink, display_order: socialLinks.length });
    setNewLink({ platform: '', url: '' });
    fetchSettings();
  };

  const removeLink = async (id: string) => {
    await supabase.from('social_links').delete().eq('id', id);
    fetchSettings();
  };

  const saveContactInfo = async () => {
    setLoading(true);
    try {
      await supabase.from('settings').upsert({ id: 1, ...contactInfo });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Settings" showBottomNav={false}>
      <div className="p-4 space-y-6">
        {/* Contact Information */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" /> Contact Information
          </h3>
          <div className="space-y-4">
            <Input label="Contact Email" placeholder="support@webcash.com" value={contactInfo.email}
              onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
              icon={<Mail className="w-5 h-5" />} />
            <Input label="Contact Phone" placeholder="+237 6XX XXX XXX" value={contactInfo.phone}
              onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
              icon={<Phone className="w-5 h-5" />} />
            <Textarea label="Address" placeholder="Business address" value={contactInfo.address}
              onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })} rows={2} />
            <Button onClick={saveContactInfo} loading={loading} className="w-full" icon={<Save className="w-4 h-4" />}>
              {saved ? 'Saved!' : 'Save Contact Info'}
            </Button>
          </div>
        </Card>

        {/* Social Links */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Link className="w-5 h-5" /> Social Links
          </h3>

          <div className="space-y-3 mb-4">
            {socialLinks.map(link => (
              <div key={link.id} className="flex items-center justify-between bg-[#1e1e2d] rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white font-medium">{link.platform}</p>
                    <p className="text-gray-400 text-sm truncate max-w-[200px]">{link.url}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeLink(link.id)}>Remove</Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Platform name" value={newLink.platform}
              onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })} />
            <Input placeholder="https://..." value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })} />
          </div>
          <Button onClick={addSocialLink} className="w-full mt-3" icon={<Link className="w-4 h-4" />}>
            Add Social Link
          </Button>
        </Card>
      </div>
    </MainLayout>
  );
};
