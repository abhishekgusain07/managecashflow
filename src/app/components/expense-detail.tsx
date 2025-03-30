'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface ExpenseDetailProps {
  expenses: Array<{
    id: string;
    description: string;
    amount: string;
    categoryId: string;
    category?: {
      name: string;
      icon: string;
      color: string;
    };
    date: string;
    location?: string;
  }>;
  onClose: () => void;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalAmount: number;
}

export default function ExpenseDetail({
  expenses,
  onClose,
  categoryName,
  categoryIcon,
  categoryColor,
  totalAmount
}: ExpenseDetailProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm dark:bg-black/60">
      <div className="w-full max-w-md px-4 py-6 mx-4 overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div 
              className="flex items-center justify-center w-10 h-10 mr-3 rounded-full"
              style={{ backgroundColor: categoryColor + '33' }}
            >
              <span className="text-lg">{categoryIcon}</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {categoryName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ₹{totalAmount.toFixed(2)} total
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {expenses.map((expense) => (
              <div key={expense.id} className="py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {expense.description}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ₹{parseFloat(expense.amount).toFixed(2)}
                  </p>
                </div>
                
                <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {formatDateDistance(expense.date)}
                  </span>
                  {expense.location && (
                    <>
                      <span className="mx-1.5">•</span>
                      <span>{expense.location}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-xs font-medium text-center text-blue-600 transition-colors bg-blue-50 rounded-lg dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to format a date as "X time ago"
function formatDateDistance(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'Unknown date';
  }
} 