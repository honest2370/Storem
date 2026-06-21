import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState } from '../../components/ui';
import { BookOpen, Plus, Edit, Trash2, Upload, Link, Search } from 'lucide-react';
import type { Course } from '../../types';

export const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [search]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let query = supabase.from('courses').select('*');
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    await supabase.from('courses').delete().eq('id', id);
    fetchCourses();
  };

  return (
    <MainLayout title="Manage Courses" showBottomNav={false}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-5 h-5" />}
            className="flex-1 mr-3"
          />
          <Button
            onClick={() => {
              setEditingCourse(null);
              setShowModal(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Course
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-[#1e1e2d] rounded-xl h-24" />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="space-y-3">
            {courses.map(course => (
              <Card key={course.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{course.title}</h3>
                      <p className="text-gray-400 text-sm">{course.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={course.is_published ? 'success' : 'warning'}>
                          {course.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        <Badge variant="info">{course.upload_type}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingCourse(course);
                        setShowModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(course.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={<BookOpen className="w-8 h-8" />} title="No Courses" />
        )}

        <CourseFormModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          course={editingCourse}
          onSuccess={() => {
            setShowModal(false);
            fetchCourses();
          }}
        />
      </div>
    </MainLayout>
  );
};

const CourseFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onSuccess: () => void;
}> = ({ isOpen, onClose, course, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'programming',
    instructor: '',
    duration: '',
    lessons_count: '',
    upload_type: 'manual' as 'manual' | 'link',
    content_url: '',
    is_published: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description || '',
        category: course.category,
        instructor: course.instructor || '',
        duration: course.duration || '',
        lessons_count: course.lessons_count?.toString() || '',
        upload_type: course.upload_type,
        content_url: course.content_url || '',
        is_published: course.is_published
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'programming',
        instructor: '',
        duration: '',
        lessons_count: '',
        upload_type: 'manual',
        content_url: '',
        is_published: false
      });
    }
  }, [course]);

  const handleSubmit = async () => {
    if (!formData.title) return;
    setLoading(true);

    try {
      const data = {
        ...formData,
        lessons_count: formData.lessons_count ? parseInt(formData.lessons_count) : null
      };

      if (course) {
        await supabase.from('courses').update(data).eq('id', course.id);
      } else {
        await supabase.from('courses').insert(data);
      }

      onSuccess();
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={course ? 'Edit Course' : 'Add Course'} size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <Input
          label="Title"
          placeholder="Course title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <Textarea
          label="Description"
          placeholder="Course description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: 'programming', label: 'Programming' },
              { value: 'design', label: 'Design' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'business', label: 'Business' },
              { value: 'other', label: 'Other' }
            ]}
          />

          <Input
            label="Instructor"
            placeholder="Instructor name"
            value={formData.instructor}
            onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Duration"
            placeholder="e.g., 5 hours"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          />

          <Input
            label="Lessons Count"
            type="number"
            placeholder="Number of lessons"
            value={formData.lessons_count}
            onChange={(e) => setFormData({ ...formData, lessons_count: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Upload Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFormData({ ...formData, upload_type: 'manual' })}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                formData.upload_type === 'manual'
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-[#1e1e2d] border-[#2a2a3d] text-gray-400'
              }`}
            >
              <Upload className="w-5 h-5" />
              Manual Upload
            </button>
            <button
              onClick={() => setFormData({ ...formData, upload_type: 'link' })}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                formData.upload_type === 'link'
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-[#1e1e2d] border-[#2a2a3d] text-gray-400'
              }`}
            >
              <Link className="w-5 h-5" />
              Link to Course
            </button>
          </div>
        </div>

        {formData.upload_type === 'link' ? (
          <Input
            label="Course URL"
            placeholder="https://..."
            value={formData.content_url}
            onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
          />
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Course Files</label>
            <div className="border-2 border-dashed border-[#2a2a3d] rounded-xl p-6 text-center">
              <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Click or drag files to upload</p>
              <input type="file" multiple className="hidden" id="course-files" />
              <label htmlFor="course-files" className="cursor-pointer">
                <span className="text-indigo-400 text-sm">Browse files</span>
              </label>
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_published}
            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
            className="w-4 h-4 rounded border-gray-600 bg-[#1e1e2d] text-indigo-600"
          />
          <span className="text-gray-300">Published</span>
        </label>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">
            {course ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
