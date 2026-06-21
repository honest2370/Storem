import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Drawer } from './Drawer';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useApp } from '../../store/AppContext';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBottomNav?: boolean;
  showHeader?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  showBottomNav = true,
  showHeader = true
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, isAdmin } = useApp();

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      if (drawerOpen) {
        setDrawerOpen(false);
      } else if (location.pathname !== '/dashboard' && location.pathname !== '/') {
        navigate(-1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [drawerOpen, location.pathname, navigate]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const publicPaths = ['/', '/login', '/register', '/payment'];
      if (!publicPaths.includes(location.pathname)) {
        navigate('/login');
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Drawer isOpen={drawerOpen} onClose={closeDrawer} />
      
      {showHeader && (
        <Header onMenuClick={toggleDrawer} title={title} />
      )}
      
      <main className={`${showBottomNav && !isAdmin ? 'pb-20' : ''} ${showHeader ? 'pt-0' : ''}`}>
        {children}
      </main>
      
      {showBottomNav && <BottomNav />}
    </div>
  );
};
