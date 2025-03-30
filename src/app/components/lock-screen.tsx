'use client';

import { useState } from 'react';
import { useAuth } from '../context/auth-context';

export default function LockScreen() {
  const { unlock } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlock(password);
    if (!success) {
      setError(true);
      setTimeout(() => setError(false), 2000);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-black">
      <div className="w-full max-w-sm px-8 py-10 mx-4 backdrop-blur-sm bg-white/80 dark:bg-black/40 rounded-2xl shadow-xl dark:shadow-gray-900/30">
        <div className="text-center">
          <h2 className="text-2xl font-medium tracking-tight text-gray-800 dark:text-white">
            Money<span className="font-bold text-blue-600 dark:text-blue-400">Whisper</span>
          </h2>
          <div className="w-16 h-1 mx-auto mt-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3.5 text-sm ${
                error ? 'border-red-500' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'
              } bg-white/60 dark:bg-gray-900/60 text-gray-900 dark:text-white rounded-lg outline-none transition-all border ${
                error ? 'animate-shake' : ''
              }`}
              placeholder="Enter password"
              required
              autoFocus
            />
            {error && (
              <p className="mt-2 text-xs font-medium text-red-500">
                Incorrect password. Please try again.
              </p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full px-4 py-3 mt-6 text-sm font-medium text-white transition-all bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Unlock
          </button>
        </form>
        
        {/* GitHub link */}
        <div className="mt-10 text-center">
          <a 
            href="https://github.com/abhishekgusain07" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 space-x-2 text-xs font-medium text-gray-600 transition-all dark:text-gray-300 rounded-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md group"
          >
            <span className="relative">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-sm opacity-0 group-hover:opacity-70 transition-opacity"></span>
              <span className="relative">Crafted with ✨ by Abhishek</span>
            </span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-gray-700 dark:text-gray-300 transition-transform group-hover:scale-110 group-hover:text-indigo-500 dark:group-hover:text-indigo-400"
            >
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
} 