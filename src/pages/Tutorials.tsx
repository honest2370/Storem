import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { MainLayout } from '../components/Layout/MainLayout';
import { Card, Button, Badge, Input, Tabs, EmptyState } from '../components/ui';
import { FileText, Search, ChevronRight, Play, Download, Lock } from 'lucide-react';
import type { Tutorial } from '../types';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'setup', label: 'Setup Guides' },
  { id: 'streaming', label: 'Streaming' },
  { id: 'proxy', label: 'Proxy Setup' },
  { id: 'general', label: 'General' },
];

export const Tutorials: React.FC = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchTutorials();
  }, [activeCategory, search]);

  const fetchTutorials = async () => {
    setLoading(true);
    try {
      let query = supabase.from('tutorials').select('*').eq('is_published', true);
      
      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }
      
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }
      
      const { data } = await query.order('created_at', { ascending: false });
      setTutorials(data || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  if (!user?.subscription_active) {
    return (
      <MainLayout title="Tutorials">
        <div className="p-4">
          <Card className="text-center py-12">
            <Lock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Subscription Required</h2>
            <Button onClick={() => navigate('/payment')}>Activate Now</Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Tutorials">
      <div className="p-4 space-y-4">
        <Input
          placeholder="Search tutorials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />

        <Tabs
          tabs={categories.map(c => ({ id: c.id, label: c.label }))}
          activeTab={activeCategory}
          onTabChange={setActiveCategory}
        />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-[#1e1e2d] rounded-xl h-24" />
            ))}
          </div>
        ) : tutorials.length > 0 ? (
          <div className="space-y-3">
            {tutorials.map(tutorial => (
              <Card
                key={tutorial.id}
                hover
                onClick={() => navigate(`/tutorials/${tutorial.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-[#1e1e2d] rounded-xl flex items-center justify-center flex-shrink-0">
                    {tutorial.video_url ? (
                      <Play className="w-6 h-6 text-indigo-400" />
                    ) : (
                      <FileText className="w-6 h-6 text-indigo-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{tutorial.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{tutorial.description}</p>
                    <Badge variant="info" className="mt-2">{tutorial.category}</Badge>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={<FileText className="w-8 h-8" />} title="No Tutorials Found" />
        )}
      </div>
    </MainLayout>
  );
};

export const TutorialDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTutorial();
  }, [id]);

  const fetchTutorial = async () => {
    try {
      const { data } = await supabase
        .from('tutorials')
        .select('*')
        .eq('id', id)
        .single();
      setTutorial(data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Loading...">
        <div className="p-4 animate-pulse space-y-4">
          <div className="h-48 bg-[#1e1e2d] rounded-xl" />
          <div className="h-6 bg-[#1e1e2d] rounded w-3/4" />
        </div>
      </MainLayout>
    );
  }

  if (!tutorial) {
    return (
      <MainLayout title="Not Found">
        <div className="p-4">
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="Tutorial Not Found"
            action={<Button onClick={() => navigate('/tutorials')}>Back</Button>}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={tutorial.title}>
      <div className="p-4 space-y-6">
        {tutorial.video_url && (
          <div className="aspect-video bg-[#1e1e2d] rounded-xl flex items-center justify-center">
            <Button
              size="lg"
              onClick={() => window.open(tutorial.video_url, '_blank')}
              icon={<Play className="w-6 h-6" />}
            >
              Watch Video
            </Button>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{tutorial.title}</h1>
          <p className="text-gray-400 mb-4">{tutorial.description}</p>
          <Badge variant="info">{tutorial.category}</Badge>
        </div>

        <Card>
          <div className="prose prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: tutorial.content }} />
          </div>
        </Card>

        {tutorial.files && tutorial.files.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Attachments</h2>
            <div className="space-y-2">
              {tutorial.files.map((file, idx) => (
                <Card key={idx} hover padding="sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-white text-sm">{file.name}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => window.open(file.url, '_blank')}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
