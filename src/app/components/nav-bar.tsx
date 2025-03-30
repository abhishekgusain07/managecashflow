'use client';

import { useAuth } from '../context/auth-context';

export default function NavBar() {
  const { lock } = useAuth();

  return (
    <div className="flex items-center justify-end py-4">
      <button
        onClick={lock}
        className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors bg-white/80 dark:bg-gray-800/40 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5 mr-1.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        Lock
      </button>
    </div>
  );
} 