import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState } from '../../components/ui';
import { Package, Plus, Edit, Trash2, Search, Upload } from 'lucide-react';
import type { DigitalProduct } from '../../types';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DigitalProduct | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchProducts(); }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('digital_products').select('*');
      if (search) query = query.ilike('title', `%${search}%`);
      const { data } = await query.order('created_at', { ascending: false });
      setProducts(data || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await supabase.from('digital_products').delete().eq('id', id);
    fetchProducts();
  };

  return (
    <MainLayout title="Manage Products" showBottomNav={false}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-5 h-5" />} className="flex-1 mr-3" />
          <Button onClick={() => { setEditingProduct(null); setShowModal(true); }} icon={<Plus className="w-4 h-4" />}>
            Add Product
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse bg-[#1e1e2d] rounded-xl h-40" />)}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map(product => (
              <Card key={product.id}>
                <div className="w-full aspect-video bg-[#1e1e2d] rounded-lg mb-2 flex items-center justify-center">
                  <Package className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-white font-medium text-sm truncate">{product.title}</h3>
                <p className="text-gray-400 text-xs truncate mb-2">{product.category}</p>
                <div className="flex items-center justify-between">
                  <Badge variant={product.is_published ? 'success' : 'warning'} className="text-xs">
                    {product.is_published ? 'Published' : 'Draft'}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditingProduct(product); setShowModal(true); }}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Package className="w-8 h-8" />} title="No Products" />
        )}

        <ProductFormModal isOpen={showModal} onClose={() => setShowModal(false)} product={editingProduct}
          onSuccess={() => { setShowModal(false); fetchProducts(); }} />
      </div>
    </MainLayout>
  );
};

const ProductFormModal: React.FC<{
  isOpen: boolean; onClose: () => void; product: DigitalProduct | null; onSuccess: () => void;
}> = ({ isOpen, onClose, product, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'templates', file_url: '', file_name: '', file_size: 0, is_published: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title, description: product.description || '', category: product.category,
        file_url: product.file_url || '', file_name: product.file_name || '', file_size: product.file_size || 0,
        is_published: product.is_published
      });
    } else {
      setFormData({ title: '', description: '', category: 'templates', file_url: '', file_name: '', file_size: 0, is_published: false });
    }
  }, [product]);

  const handleSubmit = async () => {
    if (!formData.title) return;
    setLoading(true);
    try {
      if (product) {
        await supabase.from('digital_products').update(formData).eq('id', product.id);
      } else {
        await supabase.from('digital_products').insert(formData);
      }
      onSuccess();
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Edit Product' : 'Add Product'} size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <Input label="Title" placeholder="Product title" value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        <Textarea label="Description" placeholder="Product description" value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
        <Select label="Category" value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={[
            { value: 'templates', label: 'Templates' },
            { value: 'ebooks', label: 'E-Books' },
            { value: 'software', label: 'Software' },
            { value: 'graphics', label: 'Graphics' },
            { value: 'other', label: 'Other' }
          ]} />
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Product File</label>
          <div className="border-2 border-dashed border-[#2a2a3d] rounded-xl p-6 text-center">
            <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Upload product file</p>
            <input type="file" className="hidden" id="product-file" />
            <label htmlFor="product-file" className="cursor-pointer">
              <span className="text-indigo-400 text-sm">Browse</span>
            </label>
          </div>
        </div>

        <Input label="File URL (optional)" placeholder="https://..." value={formData.file_url}
          onChange={(e) => setFormData({ ...formData, file_url: e.target.value })} />

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.is_published}
            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
            className="w-4 h-4 rounded border-gray-600 bg-[#1e1e2d] text-indigo-600" />
          <span className="text-gray-300">Published</span>
        </label>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">{product ? 'Update' : 'Create'}</Button>
        </div>
      </div>
    </Modal>
  );
};
