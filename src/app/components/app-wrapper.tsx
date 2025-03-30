'use client';
import { useAuth } from "../context/auth-context";
import LockScreen from "./lock-screen";

 

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { isUnlocked, isLoading } = useAuth();

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-black">
        <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin dark:border-gray-700">
          <div className="w-full h-full border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  // If the app is locked, show the lock screen
  if (!isUnlocked) {
    return <LockScreen />;
  }

  // Otherwise, show the children
  return <>{children}</>;
} 