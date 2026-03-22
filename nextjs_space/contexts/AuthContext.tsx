import React, { createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  session: { user: User } | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value: AuthContextType = {
    user: null,
    session: null,
    status: 'unauthenticated',
    signIn: async () => {},
    signOut: async () => {},
    isLoading: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
