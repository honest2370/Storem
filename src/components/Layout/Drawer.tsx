import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import {
  Home,
  BookOpen,
  Package,
  User,
  Server,
  FileText,
  Settings,
  LogOut,
  X,
  Wallet,
  Shield,
  Users,
  BarChart3,
  Bell,
  CreditCard,
  MessageSquare,
  Link as LinkIcon,
  Radio
} from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const userMenuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/courses', label: 'Courses', icon: BookOpen },
  { path: '/products', label: 'Digital Products', icon: Package },
  { path: '/accounts', label: 'Accounts', icon: User },
  { path: '/proxies', label: 'Proxies', icon: Server },
  { path: '/tutorials', label: 'Tutorials', icon: FileText },
  { path: '/support', label: 'Support', icon: MessageSquare },
  { path: '/wallet', label: 'My Wallet', icon: Wallet },
];

const adminMenuItems = [
  { path: '/admin', label: 'Dashboard', icon: BarChart3 },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/courses', label: 'Courses', icon: BookOpen },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/accounts', label: 'Accounts', icon: User },
  { path: '/admin/proxies', label: 'Proxies', icon: Server },
  { path: '/admin/tutorials', label: 'Tutorials', icon: FileText },
  { path: '/admin/payments', label: 'Payments', icon: CreditCard },
  { path: '/admin/tickets', label: 'Support Tickets', icon: MessageSquare },
  { path: '/admin/notifications', label: 'Notifications', icon: Bell },
  { path: '/admin/podcasts', label: 'Podcasts', icon: Radio },
  { path: '/admin/socials', label: 'Social Links', icon: LinkIcon },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useApp();

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const handleLogout = async () => {
    await logout();
    navigate('/');
    onClose();
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-[#0d0d12] border-r border-[#1e1e2d] z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e1e2d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">WebCash</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1e1e2d] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-[#1e1e2d]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-white font-medium">{user.username}</p>
                <p className="text-gray-400 text-sm">{user.email}</p>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full mt-1">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white border border-indigo-500/30'
                        : 'text-gray-400 hover:bg-[#1e1e2d] hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#1e1e2d] space-y-2">
          <button
            onClick={handleBack}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-[#1e1e2d] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Go Back</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};
