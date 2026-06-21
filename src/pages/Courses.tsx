import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { MainLayout } from '../components/Layout/MainLayout';
import { Card, Button, Input, Badge, Tabs, EmptyState, Modal } from '../components/ui';
import {
  BookOpen,
  Search,
  ChevronRight,
  Clock,
  Play,
  Download,
  ExternalLink,
  Lock,
  FileText
} from 'lucide-react';
import type { Course } from '../types';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'programming', label: 'Programming' },
  { id: 'design', label: 'Design' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'business', label: 'Business' },
  { id: 'other', label: 'Other' },
];

export const Courses: React.FC = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchCourses();
  }, [activeCategory, search]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let query = supabase.from('courses').select('*').eq('is_published', true);
      
      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }
      
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }
      
      const { data } = await query.order('created_at', { ascending: false });
      setCourses(data || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  if (!user?.subscription_active) {
    return (
      <MainLayout title="Courses">
        <div className="p-4">
          <Card className="text-center py-12">
            <Lock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Subscription Required</h2>
            <p className="text-gray-400 mb-4">Please activate your subscription to access courses</p>
            <Button onClick={() => navigate('/payment')}>Activate Now</Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Courses">
      <div className="p-4 space-y-4">
        {/* Search */}
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />

        {/* Categories */}
        <Tabs
          tabs={categories.map(c => ({ id: c.id, label: c.label }))}
          activeTab={activeCategory}
          onTabChange={setActiveCategory}
        />

        {/* Courses Grid */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-[#1e1e2d] rounded-xl h-32" />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid gap-4">
            {courses.map(course => (
              <Card
                key={course.id}
                hover
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-[#1e1e2d] rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold mb-1">{course.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-2">{course.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {course.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {course.duration}
                        </span>
                      )}
                      {course.lessons_count && (
                        <span>{course.lessons_count} lessons</span>
                      )}
                      <Badge variant="info">{course.category}</Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="No Courses Found"
            description="Try adjusting your search or filter"
          />
        )}
      </div>
    </MainLayout>
  );
};

export const CourseDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      setCourse(data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Loading...">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-[#1e1e2d] rounded-xl" />
            <div className="h-6 bg-[#1e1e2d] rounded w-3/4" />
            <div className="h-4 bg-[#1e1e2d] rounded w-1/2" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout title="Course Not Found">
        <div className="p-4">
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="Course Not Found"
            action={<Button onClick={() => navigate('/courses')}>Back to Courses</Button>}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={course.title}>
      <div className="p-4 space-y-6">
        {/* Course Header */}
        <div className="aspect-video bg-[#1e1e2d] rounded-xl flex items-center justify-center">
          {course.upload_type === 'link' ? (
            <Play className="w-16 h-16 text-indigo-400" />
          ) : (
            <BookOpen className="w-16 h-16 text-indigo-400" />
          )}
        </div>

        {/* Course Info */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{course.title}</h1>
          <p className="text-gray-400 mb-4">{course.description}</p>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{course.category}</Badge>
            {course.duration && (
              <Badge variant="default">
                <Clock className="w-3 h-3 mr-1" /> {course.duration}
              </Badge>
            )}
            {course.instructor && (
              <Badge variant="default">{course.instructor}</Badge>
            )}
          </div>
        </div>

        {/* Access Button */}
        {course.upload_type === 'link' && course.content_url ? (
          <Button
            className="w-full"
            size="lg"
            onClick={() => window.open(course.content_url, '_blank')}
            icon={<ExternalLink className="w-5 h-5" />}
            iconPosition="right"
          >
            Access Course
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={() => setShowModal(true)}
            icon={<Download className="w-5 h-5" />}
          >
            Download Course Files
          </Button>
        )}

        {/* Course Files */}
        {course.files && course.files.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Course Materials</h2>
            <div className="space-y-2">
              {course.files.map((file, idx) => (
                <Card key={idx} hover padding="sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-white text-sm">{file.name}</p>
                        <p className="text-gray-500 text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Download Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Download Course"
        >
          <p className="text-gray-400 mb-4">
            You are about to download all course materials. Make sure you have enough storage space.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button className="flex-1">
              Download
            </Button>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};
