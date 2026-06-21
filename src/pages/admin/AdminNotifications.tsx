import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Card, Button, Input, Textarea, Select } from '../../components/ui';
import { Bell, Send, Radio, CheckCircle } from 'lucide-react';

export const AdminNotifications: React.FC = () => {
  const [tab, setTab] = useState<'notification' | 'podcast'>('notification');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [audioUrl, setAudioUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendNotification = async () => {
    if (!title || !message) return;
    setLoading(true);
    try {
      // Insert notification for all users (in production, this would trigger push notifications)
      const { data: users } = await supabase.from('users').select('id');
      if (users) {
        const notifications = users.map(u => ({
          user_id: u.id,
          title,
          message,
          type
        }));
        await supabase.from('notifications').insert(notifications);
      }
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      setTitle('');
      setMessage('');
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const sendPodcast = async () => {
    if (!title || !audioUrl) return;
    setLoading(true);
    try {
      await supabase.from('podcasts').insert({
        title,
        description,
        audio_url: audioUrl
      });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      setTitle('');
      setDescription('');
      setAudioUrl('');
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Notifications & Podcasts" showBottomNav={false}>
      <div className="p-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab('notification')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
              tab === 'notification' ? 'bg-indigo-600 text-white' : 'bg-[#1e1e2d] text-gray-400'
            }`}>
            <Bell className="w-5 h-5" /> Notifications
          </button>
          <button onClick={() => setTab('podcast')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
              tab === 'podcast' ? 'bg-indigo-600 text-white' : 'bg-[#1e1e2d] text-gray-400'
            }`}>
            <Radio className="w-5 h-5" /> Podcasts
          </button>
        </div>

        {sent && (
          <Card className="bg-green-500/10 border-green-500/30">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400">Sent successfully!</span>
            </div>
          </Card>
        )}

        {tab === 'notification' ? (
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Send Notification to All Users</h3>
            <div className="space-y-4">
              <Input label="Title" placeholder="Notification title" value={title}
                onChange={(e) => setTitle(e.target.value)} />
              <Textarea label="Message" placeholder="Notification message" value={message}
                onChange={(e) => setMessage(e.target.value)} rows={3} />
              <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}
                options={[
                  { value: 'info', label: 'Info' },
                  { value: 'success', label: 'Success' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'error', label: 'Error' }
                ]} />
              <Button onClick={sendNotification} loading={loading} className="w-full"
                icon={<Send className="w-4 h-4" />}>
                Send to All Users
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Upload Podcast</h3>
            <div className="space-y-4">
              <Input label="Title" placeholder="Podcast title" value={title}
                onChange={(e) => setTitle(e.target.value)} />
              <Textarea label="Description" placeholder="Podcast description" value={description}
                onChange={(e) => setDescription(e.target.value)} rows={3} />
              <Input label="Audio URL" placeholder="https://.../audio.mp3" value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)} />
              <Button onClick={sendPodcast} loading={loading} className="w-full"
                icon={<Radio className="w-4 h-4" />}>
                Publish Podcast
              </Button>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};
