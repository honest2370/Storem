import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Notification as NotificationType } from '../types';

// Simple notification sound player
const playNotificationSound = (type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  try {
    const sounds: Record<string, string> = {
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      info: '/sounds/info.mp3',
      warning: '/sounds/warning.mp3'
    };
    const audio = new Audio(sounds[type] || sounds.info);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // Ignore audio errors
  }
};

// Request notification permission
const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

interface AppState {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  notifications: NotificationType[];
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  addNotification: (notification: Omit<NotificationType, 'id' | 'created_at' | 'is_read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    user: null,
    isAdmin: false,
    isLoading: true,
    isAuthenticated: false,
    notifications: [],
    theme: 'dark',
    sidebarOpen: false
  });

  const refreshUser = useCallback(async () => {
    // Skip if Supabase is not configured
    if (!isSupabaseConfigured) {
      setState(prev => ({
        ...prev,
        user: null,
        isAdmin: false,
        isAuthenticated: false,
        isLoading: false
      }));
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        const isAdminUser = userData?.role === 'admin' || session.user.email === 'admin@webcash.com';

        setState(prev => ({
          ...prev,
          user: userData,
          isAdmin: isAdminUser,
          isAuthenticated: true,
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          isAdmin: false,
          isAuthenticated: false,
          isLoading: false
        }));
      }
    } catch {
      setState(prev => ({
        ...prev,
        user: null,
        isAdmin: false,
        isAuthenticated: false,
        isLoading: false
      }));
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, _session) => {
      refreshUser();
    });

    requestNotificationPermission();

    return () => subscription.unsubscribe();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      playNotificationSound('success');
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  };

  const register = async (email: string, password: string, username: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { username }
        }
      });
      
      if (error) throw error;

      if (data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          email,
          username,
          is_active: true,
          is_banned: false,
          is_suspended: false,
          subscription_active: false
        });
      }

      playNotificationSound('success');
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' };
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setState(prev => ({
      ...prev,
      user: null,
      isAdmin: false,
      isAuthenticated: false
    }));
  };

  const toggleTheme = () => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const toggleSidebar = () => {
    setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  };

  const closeSidebar = () => {
    setState(prev => ({ ...prev, sidebarOpen: false }));
  };

  const addNotification = (notification: Omit<NotificationType, 'id' | 'created_at' | 'is_read'>) => {
    const newNotification: NotificationType = {
      ...notification,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      is_read: false
    };
    setState(prev => ({
      ...prev,
      notifications: [newNotification, ...prev.notifications]
    }));
    playNotificationSound(notification.type);
  };

  const markNotificationRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      )
    }));
  };

  const markAllNotificationsRead = () => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, is_read: true }))
    }));
  };

  return (
    <AppContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      refreshUser,
      toggleTheme,
      toggleSidebar,
      closeSidebar,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
