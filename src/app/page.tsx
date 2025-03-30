'use client';

import { useState } from 'react';
import Link from 'next/link';
import NavBar from './components/nav-bar';

export default function Home() {
  const [expenseText, setExpenseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseText.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: expenseText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process expense');
      }

      const data = await response.json();
      setSuccessMessage(`Added expense: ${data.expense.description} for ₹${data.expense.amount}`);
      
      // Reset form on success
      setExpenseText('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add expense. Please try again.');
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
      <div className="container max-w-md px-4 mx-auto">
        <div className="flex items-center justify-between py-4">
          <Link
            href="/insights"
            className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors bg-white/80 dark:bg-gray-800/40 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Insights
          </Link>
          <NavBar />
        </div>
        
        <header className="py-8">
          <h1 className="text-2xl font-medium tracking-tight text-center text-gray-800 dark:text-white">
            Money<span className="font-bold text-blue-600 dark:text-blue-400">Whisper</span>
          </h1>
          <p className="mt-2 text-sm text-center text-gray-500 dark:text-gray-400">
            Effortlessly track your expenses
          </p>
        </header>

        <main className="py-6">
          <div className="p-6 mb-8 overflow-hidden bg-white dark:bg-gray-900/60 rounded-2xl shadow-sm backdrop-blur-sm ring-1 ring-gray-900/5 dark:ring-white/10">
            <form onSubmit={handleSubmit}>
              <label htmlFor="expense-input" className="block mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                What did you buy?
              </label>
              <div className="relative">
                <input
                  id="expense-input"
                  type="text"
                  value={expenseText}
                  onChange={(e) => setExpenseText(e.target.value)}
                  placeholder="e.g., coffee for 40 at Starbucks"
                  className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white/80 dark:bg-gray-900/60 text-gray-900 dark:text-white pr-12"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !expenseText.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-xs text-red-500">{error}</p>
              )}
              {successMessage && (
                <p className="mt-2 text-xs font-medium text-green-500">{successMessage}</p>
              )}
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Simply describe your purchase in natural language
              </p>
            </form>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Recent Expenses
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">Today</span>
            </div>
            
            <div className="space-y-3">
              {/* Empty state for expenses */}
              <div className="flex flex-col items-center justify-center p-6 text-center bg-white/60 dark:bg-gray-900/40 rounded-xl">
                <div className="flex items-center justify-center w-10 h-10 mb-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No expenses recorded yet
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
