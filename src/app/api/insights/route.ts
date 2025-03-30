import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { expenses, categories, type Category, type Expense } from '@/db/schema';
import { sql, desc, and, eq, gte, lte } from 'drizzle-orm';
import { parseISO, subMonths, isValid, startOfDay, endOfDay } from 'date-fns';

interface CategoryInsight {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

interface ExpenseWithCategory extends Expense {
  category?: {
    name: string;
    icon: string;
    color: string;
  };
}

export async function GET(request: Request) {
  try {
    // Get parameters from query
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const categoryId = searchParams.get('categoryId');
    
    // Parse dates or use defaults (last 3 months to now)
    let startDate: Date;
    let endDate: Date;
    
    try {
      // Handle various scenarios for date inputs
      if (startDateParam) {
        const parsedStartDate = parseISO(startDateParam);
        startDate = isValid(parsedStartDate) ? startOfDay(parsedStartDate) : startOfDay(subMonths(new Date(), 3));
      } else {
        startDate = startOfDay(subMonths(new Date(), 3));
      }
      
      if (endDateParam) {
        const parsedEndDate = parseISO(endDateParam);
        endDate = isValid(parsedEndDate) ? endOfDay(parsedEndDate) : endOfDay(new Date());
      } else {
        endDate = endOfDay(new Date());
      }
    } catch (error) {
      console.error('Error parsing dates:', error);
      startDate = startOfDay(subMonths(new Date(), 3));
      endDate = endOfDay(new Date());
    }
    
    console.log(`Searching for expenses between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    
    // Fetch all categories first (we want to return all categories even if there are no expenses)
    const categoryData = await db.select().from(categories);
    
    // Build query conditions based on provided parameters
    let queryConditions = and(
      gte(expenses.date, startDate),
      lte(expenses.date, endDate)
    );
    
    // Add category filter if specified
    if (categoryId) {
      queryConditions = and(
        queryConditions,
        eq(expenses.categoryId, categoryId)
      );
    }
    
    // Execute the query with all conditions
    const expenseData = await db
      .select()
      .from(expenses)
      .where(queryConditions)
      .orderBy(desc(expenses.date));
    
    console.log(`Found ${expenseData.length} expenses between ${startDate.toISOString()} and ${endDate.toISOString()}${categoryId ? ` for category ${categoryId}` : ''}`);
    
    // For debugging, log each expense's date
    if (expenseData.length > 0) {
      console.log('Expense dates found:');
      expenseData.forEach(expense => {
        console.log(`- ${expense.id}: ${expense.date.toISOString()}`);
      });
    } else {
      console.log('No expenses found matching the criteria');
    }
    
    // If no expenses found, return empty data with categories
    if (expenseData.length === 0) {
      // Just return categories with zero amounts
      const emptyCategoryData = categoryData.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '📊',
        color: cat.color || '#9E9E9E',
        amount: 0,
        percentage: 0,
      }));
      
      return NextResponse.json({
        startDate,
        endDate,
        totalAmount: 0,
        categoryData: emptyCategoryData,
        expenses: [],
      });
    }
    
    // Create a map of categories for quick lookup
    const categoryMap = new Map<string, Category>();
    categoryData.forEach(category => {
      categoryMap.set(category.id, category);
    });
    
    // Enrich expense data with category information
    const enrichedExpenses: ExpenseWithCategory[] = expenseData.map(expense => {
      const category = expense.categoryId ? categoryMap.get(expense.categoryId) : undefined;
      
      return {
        ...expense,
        category: category ? {
          name: category.name,
          icon: category.icon || '📊',
          color: category.color || '#9E9E9E',
        } : undefined
      };
    });
    
    // Process data to calculate totals by category
    const categoryTotals = calculateCategoryTotals(expenseData, categoryData);
    
    return NextResponse.json({
      startDate,
      endDate,
      totalAmount: categoryTotals.totalAmount,
      categoryData: categoryTotals.categoryInsights,
      expenses: enrichedExpenses,
    });
    
  } catch (error) {
    console.error('Error fetching insights data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights data' },
      { status: 500 }
    );
  }
}

// Helper function to calculate category totals
function calculateCategoryTotals(
  expenses: Expense[], 
  categories: Category[]
): { totalAmount: number; categoryInsights: CategoryInsight[] } {
  // Create a map of categories for quick lookup
  const categoryMap = new Map<string, Category>();
  categories.forEach(category => {
    categoryMap.set(category.id, category);
  });
  
  // Initialize category totals
  const categoryAmounts = new Map<string, number>();
  let totalAmount = 0;
  
  // Calculate totals by category
  expenses.forEach(expense => {
    const amount = parseFloat(expense.amount.toString());
    totalAmount += amount;
    
    if (expense.categoryId) {
      const currentAmount = categoryAmounts.get(expense.categoryId) || 0;
      categoryAmounts.set(expense.categoryId, currentAmount + amount);
    } else {
      // Handle uncategorized expenses (use Miscellaneous category if available)
      const miscCategory = categories.find(cat => cat.name === 'Miscellaneous');
      if (miscCategory) {
        const currentAmount = categoryAmounts.get(miscCategory.id) || 0;
        categoryAmounts.set(miscCategory.id, currentAmount + amount);
      }
    }
  });
  
  // Create category insights with percentages
  const categoryInsights: CategoryInsight[] = [];
  
  // Include all categories in the response, even those with zero expenses
  categories.forEach(category => {
    const amount = categoryAmounts.get(category.id) || 0;
    categoryInsights.push({
      id: category.id,
      name: category.name,
      icon: category.icon || '📊',
      color: category.color || '#9E9E9E',
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    });
  });
  
  // Sort by amount (descending)
  categoryInsights.sort((a, b) => b.amount - a.amount);
  
  return {
    totalAmount,
    categoryInsights,
  };
}