import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { MainLayout } from '../components/Layout/MainLayout';
import { Card, Button, Badge, Input, Tabs, EmptyState } from '../components/ui';
import { Package, Search, Download, Lock } from 'lucide-react';
import type { DigitalProduct } from '../types';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'templates', label: 'Templates' },
  { id: 'ebooks', label: 'E-Books' },
  { id: 'software', label: 'Software' },
  { id: 'graphics', label: 'Graphics' },
];

export const Products: React.FC = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [activeCategory, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('digital_products').select('*').eq('is_published', true);
      
      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }
      
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }
      
      const { data } = await query.order('created_at', { ascending: false });
      setProducts(data || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  if (!user?.subscription_active) {
    return (
      <MainLayout title="Products">
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
    <MainLayout title="Digital Products">
      <div className="p-4 space-y-4">
        <Input
          placeholder="Search products..."
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
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse bg-[#1e1e2d] rounded-xl h-40" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map(product => (
              <Card
                key={product.id}
                hover
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <div className="w-full aspect-video bg-[#1e1e2d] rounded-lg mb-3 flex items-center justify-center">
                  <Package className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-white font-medium text-sm truncate">{product.title}</h3>
                <p className="text-gray-400 text-xs truncate mb-2">{product.description}</p>
                <Badge variant="info">{product.category}</Badge>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Package className="w-8 h-8" />} title="No Products Found" />
        )}
      </div>
    </MainLayout>
  );
};

export const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<DigitalProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await supabase
        .from('digital_products')
        .select('*')
        .eq('id', id)
        .single();
      setProduct(data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (product?.file_url) {
      window.open(product.file_url, '_blank');
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

  if (!product) {
    return (
      <MainLayout title="Not Found">
        <div className="p-4">
          <EmptyState
            icon={<Package className="w-8 h-8" />}
            title="Product Not Found"
            action={<Button onClick={() => navigate('/products')}>Back</Button>}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={product.title}>
      <div className="p-4 space-y-6">
        <div className="aspect-video bg-[#1e1e2d] rounded-xl flex items-center justify-center">
          <Package className="w-16 h-16 text-purple-400" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{product.title}</h1>
          <p className="text-gray-400 mb-4">{product.description}</p>
          <Badge variant="info">{product.category}</Badge>
        </div>

        {product.file_name && (
          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">{product.file_name}</p>
                {product.file_size && (
                  <p className="text-gray-500 text-xs">
                    {(product.file_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleDownload}
          icon={<Download className="w-5 h-5" />}
        >
          Download Product
        </Button>
      </div>
    </MainLayout>
  );
};
