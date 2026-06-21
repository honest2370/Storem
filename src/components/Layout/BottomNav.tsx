import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Package, User, MessageSquare, Grid } from 'lucide-react';
import { useApp } from '../../store/AppContext';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/courses', label: 'Courses', icon: BookOpen },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/accounts', label: 'Accounts', icon: User },
  { path: '/support', label: 'Support', icon: MessageSquare },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useApp();

  if (isAdmin) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0d0d12]/95 backdrop-blur-xl border-t border-[#1e1e2d] z-30 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-indigo-400 bg-indigo-500/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-indigo-400' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => navigate('/more')}
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
            location.pathname === '/more'
              ? 'text-indigo-400 bg-indigo-500/10'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
};
