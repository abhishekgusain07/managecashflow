import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { expenses, categories } from '@/db/schema';
import { and, gte, lte } from 'drizzle-orm';
import { startOfDay, endOfDay } from 'date-fns';

// Fetch expenses for today
export async function GET() {
  try {
    // Get today's date range
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    
    // Fetch all expenses for today
    const todayExpenses = await db
      .select()
      .from(expenses)
      .where(
        and(
          gte(expenses.date, startOfToday),
          lte(expenses.date, endOfToday)
        )
      )
      .orderBy(expenses.date);
    
    // Fetch all categories for lookup
    const categoryList = await db.select().from(categories);
    
    // Create a map of categories for quick lookup
    const categoryMap = new Map();
    categoryList.forEach((category) => {
      categoryMap.set(category.id, category);
    });
    
    // Enrich expenses with category information
    const enrichedExpenses = todayExpenses.map((expense) => {
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
    
    return NextResponse.json({ 
      success: true, 
      expenses: enrichedExpenses 
    });
    
  } catch (error) {
    console.error('Error fetching today\'s expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses. Please try again.' },
      { status: 500 }
    );
  }
} 