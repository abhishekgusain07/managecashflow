'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { sha256 } from 'js-sha256';

// Change this to your preferred password hash
// Default password is "moneywhisper"
const PASSWORD_HASH = "0e24c49f7356a45c6ba8ce2f4a8ed948891cc0ef16bab97ae1555e0e6391f62c";

interface AuthContextType {
  isUnlocked: boolean;
  isLoading: boolean;
  unlock: (password: string) => boolean;
  lock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check local storage on first load
  useEffect(() => {
    const checkAuth = () => {
      const storedAuth = localStorage.getItem('moneywhisper-auth');
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth);
          if (authData.unlocked && authData.timestamp) {
            // Auto-lock after 24 hours for security
            const expiryTime = new Date(authData.timestamp).getTime() + 24 * 60 * 60 * 1000;
            if (Date.now() < expiryTime) {
              setIsUnlocked(true);
            } else {
              localStorage.removeItem('moneywhisper-auth');
            }
          }
        } catch (e) {
          localStorage.removeItem('moneywhisper-auth');
        }
      }
      setIsLoading(false);
    };

    // Small delay to prevent flash of lock screen
    const timer = setTimeout(checkAuth, 300);
    return () => clearTimeout(timer);
  }, []);

  const unlock = (password: string): boolean => {
    // Hash the input password and compare with stored hash
    const hashedInput = sha256(password);
    
    if (hashedInput === PASSWORD_HASH) {
      setIsUnlocked(true);
      // Store auth state in localStorage with timestamp
      localStorage.setItem('moneywhisper-auth', JSON.stringify({
        unlocked: true,
        timestamp: new Date().toISOString()
      }));
      return true;
    }
    return false;
  };

  const lock = () => {
    setIsUnlocked(false);
    localStorage.removeItem('moneywhisper-auth');
  };

  return (
    <AuthContext.Provider value={{ isUnlocked, isLoading, unlock, lock }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 