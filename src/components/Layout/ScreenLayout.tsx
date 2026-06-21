import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Drawer } from './Drawer';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useApp } from '../../store/AppContext';

interface ScreenLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBottomNav?: boolean;
  showHeader?: boolean;
  fullScreen?: boolean;
}

/**
 * ScreenLayout - Flutter-like page layout
 * - Prevents content from overflowing
 * - Fixed header and bottom nav positions
 * - Content area fills remaining space
 * - No overlapping elements
 */
export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  title,
  showBottomNav = true,
  showHeader = true,
  fullScreen = false
}) => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, isAdmin } = useApp();

  // Close drawer on route change
  React.useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const publicPaths = ['/', '/login', '/register', '/payment'];
      if (!publicPaths.includes(location.pathname)) {
        navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  const toggleDrawer = () => setDrawerOpen(prev => !prev);
  const closeDrawer = () => setDrawerOpen(false);

  // Full screen mode (for landing, auth, etc.)
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] overflow-hidden">
        <div className="h-full overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    );
  }

  // Admin layout (no bottom nav, sidebar navigation)
  if (isAdmin) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] overflow-hidden">
        <Drawer isOpen={drawerOpen} onClose={closeDrawer} />
        
        <div className="h-full flex flex-col">
          {showHeader && <Header onMenuClick={toggleDrawer} title={title} />}
          
          <main className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // User layout with bottom nav
  return (
    <div className="fixed inset-0 bg-[#0a0a0f] overflow-hidden">
      <Drawer isOpen={drawerOpen} onClose={closeDrawer} />
      
      <div className="h-full flex flex-col">
        {showHeader && <Header onMenuClick={toggleDrawer} title={title} />}
        
        <main className={`flex-1 overflow-y-auto overscroll-contain ${showBottomNav ? 'pb-20' : ''}`}>
          {children}
        </main>
        
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
};

// Loading screen
export const LoadingScreen: React.FC = () => (
  <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);
