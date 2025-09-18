import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authApi, accountApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  resetAccount: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (cookie exists)
    const checkAuth = async () => {
      try {
        // Try to get account snapshot to verify auth
        const response = await accountApi.getSnapshot();
        if (response?.status === 'success') {
          // User is authenticated, but we need to get user info
          // For now, we'll use a default user since we don't have a /me endpoint
          setUser({
            id: response?.data?.userId ?? 0,
            username: 'demo_user',
            startingCash: response?.data?.cash ?? 0,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        // User is not authenticated
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(username);
      
      if (response.status === 'success' && response.data) {
        setUser(response.data.user);
        toast.success(`Welcome back, ${username}!`);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear user state even if API call fails
      setUser(null);
    }
  };

  const resetAccount = async () => {
    if (!user) return;
    
    try {
      await authApi.resetAccount(user.id);
      toast.success('Account reset successfully');
      // Refresh user data
      window.location.reload();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to reset account';
      toast.error(message);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    resetAccount,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
