import React from 'react';
import { useApp } from '../../store/AppContext';
import { Menu, Bell, Search, Sun, Moon, User } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const { user, theme, toggleTheme, notifications, isAdmin } = useApp();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-30 bg-[#0d0d12]/80 backdrop-blur-xl border-b border-[#1e1e2d]">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-[#1e1e2d] rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-400" />
          </button>
          {title && (
            <h1 className="text-lg font-semibold text-white">{title}</h1>
          )}
        </div>

        {/* Center - Search (hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-[#1e1e2d] border border-[#2a2a3d] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-[#1e1e2d] rounded-xl transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-gray-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-[#1e1e2d] rounded-xl transition-colors">
            <Bell className="w-5 h-5 text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Avatar */}
          <button className="flex items-center gap-2 p-1.5 hover:bg-[#1e1e2d] rounded-xl transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <span className="hidden md:block text-sm text-white font-medium">
              {isAdmin ? 'Admin' : user?.username}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
