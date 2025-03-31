'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, isAfter, isBefore, isEqual, subDays, subMonths, endOfMonth } from 'date-fns';
import NavBar from '../components/nav-bar';
import ExpenseDetail from '../components/expense-detail';

// Interface for category data
interface CategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

// Interface for expense data
interface Expense {
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
}

// Interface for projection data
interface ProjectionCategory {
  name: string;
  icon: string;
  currentTotal: number;
  projectedTotal: number;
  reasoning: string;
}

interface ProjectionData {
  totalProjection: number;
  analysis: string;
  categories: ProjectionCategory[];
  currentDate: string;
  daysRemaining: number;
  totalSpentSoFar: number;
}

export default function InsightsPage() {
  const router = useRouter();
  
  // State for tracking selected dates
  const [startDate, setStartDate] = useState<Date | null>(subMonths(new Date(), 3)); // Use longer default range
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // State for category filters
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectAllCategories, setSelectAllCategories] = useState(true);

  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string>('');
  
  // State for category detail view
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [categoryExpenses, setCategoryExpenses] = useState<Expense[]>([]);
  
  // State to control visibility of spending by category section
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);

  // State for expense projections
  const [projectionData, setProjectionData] = useState<ProjectionData | null>(null);
  const [loadingProjections, setLoadingProjections] = useState(false);
  const [projectionError, setProjectionError] = useState<string | null>(null);
  const [showProjections, setShowProjections] = useState(true);

  useEffect(() => {
    if (startDate && endDate) {
      fetchInsightsData();
      fetchExpenseProjections();
    }
  }, [startDate, endDate]);

  useEffect(() => {
    // Filter expenses based on selected categories
    if (allExpenses.length > 0) {
      if (selectAllCategories) {
        setFilteredExpenses(allExpenses);
        setCategoryData(categories);
      } else if (selectedCategoryIds.length > 0) {
        const filtered = allExpenses.filter(expense => 
          selectedCategoryIds.includes(expense.categoryId)
        );
        setFilteredExpenses(filtered);
        
        // Update category data with filtered amounts
        const filteredCategoryData = categories
          .filter(cat => selectedCategoryIds.includes(cat.id))
          .map(cat => ({
            ...cat,
            amount: calculateCategoryAmount(cat.id, filtered),
            percentage: 0 // Will be calculated below
          }));
        
        // Calculate total and percentages
        const total = filteredCategoryData.reduce((sum, cat) => sum + cat.amount, 0);
        const withPercentages = filteredCategoryData.map(cat => ({
          ...cat,
          percentage: total > 0 ? (cat.amount / total) * 100 : 0
        }));
        
        setCategoryData(withPercentages);
        setTotalAmount(total);
      } else {
        // If no categories selected, show no expenses
        setFilteredExpenses([]);
        setCategoryData([]);
        setTotalAmount(0);
      }
    }
  }, [selectedCategoryIds, selectAllCategories, allExpenses]);

  const calculateCategoryAmount = (categoryId: string, expenses: Expense[]): number => {
    return expenses
      .filter(exp => exp.categoryId === categoryId)
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  };

  const fetchInsightsData = async () => {
    // Exit if we don't have both dates
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Format dates for API - with type assertion since we already checked for null
      const startDateParam = format(startDate as Date, 'yyyy-MM-dd');
      const endDateParam = format(endDate as Date, 'yyyy-MM-dd');
      
      const url = `/api/insights?startDate=${startDateParam}&endDate=${endDateParam}`;
      setDebug(`Fetching from: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch insights data: ${response.status}`);
      }
      
      const data = await response.json();
      setDebug(prev => `${prev}, Got data: ${data.expenses?.length || 0} expenses`);
      
      // Fetch all categories if none returned
      let allCats = data.categoryData || [];
      if (allCats.length === 0) {
        // If no categories in the data, fetch all categories
        const catResponse = await fetch('/api/categories');
        if (catResponse.ok) {
          const catData = await catResponse.json();
          allCats = catData.categories || [];
        }
      }
      
      // Store all categories for filtering
      setCategories(allCats);
      
      // Set category data for visualization
      setCategoryData(data.categoryData || []);
      
      // Set expense data
      setAllExpenses(data.expenses || []);
      setFilteredExpenses(data.expenses || []);
      setTotalAmount(data.totalAmount || 0);
      
      // Initialize with all categories selected
      if (selectAllCategories && allCats.length > 0) {
        setSelectedCategoryIds(allCats.map((cat: CategoryData) => cat.id));
      }
    } catch (err: any) {
      console.error('Error fetching insights:', err);
      setError(`Failed to load insights: ${err.message}`);
      setDebug(prev => `${prev}, Error: ${err.message}`);
      setCategories([]);
      setCategoryData([]);
      setAllExpenses([]);
      setFilteredExpenses([]);
      setTotalAmount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: CategoryData) => {
    setSelectedCategory(category);
    // Filter expenses for the selected category
    const filteredExpenses = allExpenses.filter(
      expense => expense.categoryId === category.id
    );
    setCategoryExpenses(filteredExpenses);
  };
  
  const handleCategorySelect = (categoryId: string) => {
    setSelectAllCategories(false);
    if (selectedCategoryIds.includes(categoryId)) {
      // If already selected, remove it
      const newSelected = selectedCategoryIds.filter(id => id !== categoryId);
      setSelectedCategoryIds(newSelected);
      
      // If nothing left selected, select all
      if (newSelected.length === 0) {
        handleSelectAllCategories();
      }
    } else {
      // Otherwise add it
      setSelectedCategoryIds(prev => [...prev, categoryId]);
    }
  };
  
  const handleSelectAllCategories = () => {
    setSelectAllCategories(true);
    setSelectedCategoryIds(categories.map(cat => cat.id));
  };

  // Improved date picker handling
  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
  };
  
  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
  };

  // Fix the date handling for the Apply button
  const handleApplyDateFilter = () => {
    if (startDate && endDate) {
      fetchInsightsData();
      setShowDatePicker(false);
    }
  };

  // Fetch expense projections
  const fetchExpenseProjections = async () => {
    setLoadingProjections(true);
    setProjectionError(null);
    
    try {
      const response = await fetch('/api/expense-projections');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch expense projections: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.projections) {
        setProjectionData(data.projections);
      } else {
        throw new Error(data.error || 'Failed to generate projections');
      }
    } catch (err: any) {
      console.error('Error fetching projections:', err);
      setProjectionError(`Failed to load projections: ${err.message}`);
      setProjectionData(null);
    } finally {
      setLoadingProjections(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
      
      <div className="container max-w-md px-4 mx-auto">
        <div className="flex items-center justify-between py-4">
          <Link 
            href="/"
            className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors bg-white/80 dark:bg-gray-800/40 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
          <NavBar />
        </div>
        
        <header className="py-6">
          <h1 className="text-2xl font-medium tracking-tight text-center text-gray-800 dark:text-white">
            Money<span className="font-bold text-blue-600 dark:text-blue-400">Insights</span>
          </h1>
          <p className="mt-2 text-sm text-center text-gray-500 dark:text-gray-400">
            Visualize your spending patterns
          </p>
        </header>

        <main className="py-6">
          {/* Date Range Selector - Improved UI */}
          <div className="mb-6">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-left bg-white dark:bg-gray-900/60 rounded-xl shadow-sm backdrop-blur-sm ring-1 ring-gray-900/5 dark:ring-white/10"
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">
                  {startDate && endDate 
                    ? `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`
                    : "Select date range"}
                </span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-500 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showDatePicker && (
              <div className="mt-2 bg-white dark:bg-gray-900/90 rounded-xl shadow-md ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden">
                <div className="p-4">
                  {/* Improved date picker UI */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                      <DatePicker
                        selected={startDate}
                        onChange={handleStartDateChange}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        maxDate={endDate || new Date()}
                        dateFormat="MMM d, yyyy"
                        className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">End Date</label>
                      <DatePicker
                        selected={endDate}
                        onChange={handleEndDateChange}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate || undefined}
                        maxDate={new Date()}
                        dateFormat="MMM d, yyyy"
                        className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => {
                        setStartDate(subDays(new Date(), 7));
                        setEndDate(new Date());
                        setShowDatePicker(false);
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-md"
                    >
                      Last 7 days
                    </button>
                    <button
                      onClick={() => {
                        setStartDate(subDays(new Date(), 30));
                        setEndDate(new Date());
                        setShowDatePicker(false);
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-md"
                    >
                      Last 30 days
                    </button>
                    <button
                      onClick={() => {
                        setStartDate(subMonths(new Date(), 3));
                        setEndDate(new Date());
                        setShowDatePicker(false);
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-md"
                    >
                      Last 3 months
                    </button>
                    <button
                      onClick={() => {
                        setStartDate(subMonths(new Date(), 12));
                        setEndDate(new Date());
                        setShowDatePicker(false);
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-md"
                    >
                      Last 12 months
                    </button>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleApplyDateFilter}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Category Selection - Improved UI */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter Categories</h3>
              <button
                onClick={handleSelectAllCategories}
                className="text-xs text-blue-500 dark:text-blue-400"
              >
                {selectAllCategories ? "All selected" : "Select all"}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.length > 0 ? (
                categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`flex items-center px-2 py-1.5 text-xs font-medium rounded-full transition-all ${
                      selectAllCategories || selectedCategoryIds.includes(category.id)
                        ? `text-white ring-2 ring-offset-1 ring-offset-gray-50 dark:ring-offset-gray-900 ring-white/20`
                        : `text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700`
                    }`}
                    style={{
                      backgroundColor: (selectAllCategories || selectedCategoryIds.includes(category.id)) 
                        ? category.color 
                        : undefined
                    }}
                  >
                    <span className="mr-1">{category.icon}</span>
                    {category.name}
                  </button>
                ))
              ) : (
                <div className="w-full p-3 text-xs text-center text-gray-500 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
                  No categories available
                </div>
              )}
            </div>
          </div>
          
          {/* Monthly Projections Section */}
          {!loading && !error && filteredExpenses.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Monthly Projections
                </h2>
                <button
                  onClick={() => setShowProjections(!showProjections)}
                  className="flex items-center text-xs text-blue-500 dark:text-blue-400"
                >
                  {showProjections ? 'Hide' : 'Show'}
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`w-3 h-3 ml-1 transition-transform ${showProjections ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {showProjections && (
                <div className="animate-fade-in">
                  {loadingProjections ? (
                    <div className="flex flex-col items-center justify-center p-8">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                        Generating intelligent projections...
                      </p>
                    </div>
                  ) : projectionError ? (
                    <div className="p-4 text-center bg-white/60 dark:bg-gray-900/40 rounded-xl">
                      <p className="text-xs text-red-500">{projectionError}</p>
                      <button
                        onClick={fetchExpenseProjections}
                        className="px-3 py-1.5 mt-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : projectionData ? (
                    <div className="space-y-4">
                      <div className="p-5 overflow-hidden bg-white dark:bg-gray-900/60 rounded-xl shadow-sm backdrop-blur-sm ring-1 ring-gray-900/5 dark:ring-white/10">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Expected Total
                            </h3>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              By end of {format(endOfMonth(new Date()), 'MMMM')}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              ₹{projectionData.totalProjection.toFixed(2)}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {projectionData.daysRemaining} days remaining
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                          {projectionData.analysis}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">
                              Spent so far
                            </span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              ₹{projectionData.totalSpentSoFar.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-xs">
                            <span className="text-gray-500 dark:text-gray-400">
                              Projected additional
                            </span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              ₹{(projectionData.totalProjection - projectionData.totalSpentSoFar).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-4">
                        Projected Spending by Category
                      </h3>
                      
                      <div className="space-y-3 mt-2">
                        {projectionData.categories.map((category) => (
                          <div key={category.name} className="p-4 bg-white/60 dark:bg-gray-900/40 rounded-xl">
                            <div className="flex items-start">
                              <div 
                                className="flex items-center justify-center w-8 h-8 mr-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: category.currentTotal > 0 ? 
                                  categoryData.find(c => c.name === category.name)?.color + '33' : '#9E9E9E33' }}
                              >
                                <span className="text-base">{category.icon}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                                    {category.name}
                                  </p>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                      ₹{category.projectedTotal.toFixed(2)}
                                    </p>
                                    {category.currentTotal > 0 && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {category.currentTotal.toFixed(2)} spent so far
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                  {category.reasoning}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center bg-white/60 dark:bg-gray-900/40 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        No projection data available
                      </p>
                      <button
                        onClick={fetchExpenseProjections}
                        className="px-3 py-1.5 mt-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        Generate Projections
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin dark:border-gray-700">
                <div className="w-full h-full border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading insights...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center bg-white/60 dark:bg-gray-900/40 rounded-xl">
              <p className="text-sm text-red-500">{error}</p>
              {debug && <pre className="mt-2 p-2 text-xs bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-32">{debug}</pre>}
            </div>
          ) : filteredExpenses.length > 0 && categoryData.length > 0 ? (
            <>
              {/* Summary Card */}
              <div className="p-6 mb-6 overflow-hidden bg-white dark:bg-gray-900/60 rounded-2xl shadow-sm backdrop-blur-sm ring-1 ring-gray-900/5 dark:ring-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Total Spending
                  </h2>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
                
                {/* Category Distribution Chart */}
                {categoryData.length > 0 && (
                  <div className="flex w-full h-6 mt-6 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-800">
                    {categoryData.map((category) => (
                      <div 
                        key={category.id}
                        className="h-full transition-all duration-500 ease-in-out"
                        style={{ 
                          width: `${category.percentage}%`, 
                          backgroundColor: category.color,
                          minWidth: category.percentage > 0 ? '4px' : '0' 
                        }}
                        title={`${category.name}: ${category.percentage.toFixed(1)}%`}
                      />
                    ))}
                  </div>
                )}
                
                {/* Toggle button for showing/hiding category breakdown */}
                <button
                  onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
                  className="flex items-center justify-center w-full px-4 py-2 mt-6 text-xs font-medium text-blue-600 transition-colors bg-blue-50 rounded-lg dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                >
                  {showCategoryBreakdown ? 'Hide' : 'Show'} spending by category
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`w-3 h-3 ml-1 transition-transform ${showCategoryBreakdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Category Breakdown - Now conditionally rendered */}
              {showCategoryBreakdown && (
                <div className="mb-6 animate-fade-in">
                  <h2 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Spending by Category
                  </h2>
                  
                  <div className="space-y-3">
                    {categoryData.map((category) => (
                      <div 
                        key={category.id}
                        className="flex items-center p-4 bg-white/60 dark:bg-gray-900/40 rounded-xl overflow-hidden cursor-pointer hover:bg-white/90 dark:hover:bg-gray-900/60 transition-colors"
                        onClick={() => handleCategoryClick(category)}
                      >
                        <div 
                          className="flex items-center justify-center w-10 h-10 mr-4 rounded-full"
                          style={{ backgroundColor: category.color + '33' }}  // Adding alpha for transparency
                        >
                          <span className="text-lg">{category.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                              {category.name}
                            </p>
                            <p className="ml-2 text-sm font-semibold text-gray-900 dark:text-white">
                              ₹{parseFloat(category.amount.toString()).toFixed(2)}
                            </p>
                          </div>
                          <div className="w-full h-1.5 mt-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full transition-all duration-500 ease-in-out"
                              style={{ width: `${category.percentage}%`, backgroundColor: category.color }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {category.percentage.toFixed(1)}% of total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-white/60 dark:bg-gray-900/40 rounded-xl">
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No expense data found for this time period.
              </p>
              <Link
                href="/"
                className="px-4 py-2 mt-4 text-xs font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Add some expenses
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* Category Detail Modal */}
      {selectedCategory && (
        <ExpenseDetail
          expenses={categoryExpenses}
          onClose={() => setSelectedCategory(null)}
          categoryName={selectedCategory.name}
          categoryIcon={selectedCategory.icon}
          categoryColor={selectedCategory.color}
          totalAmount={selectedCategory.amount}
        />
      )}
    </div>
  );
} 