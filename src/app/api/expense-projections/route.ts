import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { expenses, categories } from '@/db/schema';
import { and, desc, gte, lte } from 'drizzle-orm';
import { startOfMonth, endOfMonth, format, startOfDay, addDays, isWithinInterval } from 'date-fns';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// Fetch expenses and make projections for the current month
export async function GET() {
  try {
    // Get current month's date range
    const today = new Date();
    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);
    const daysElapsedInMonth = today.getDate();
    const totalDaysInMonth = endOfCurrentMonth.getDate();
    
    // Fetch current month's expenses
    const currentMonthExpenses = await db
      .select()
      .from(expenses)
      .where(
        and(
          gte(expenses.date, startOfCurrentMonth),
          lte(expenses.date, today)
        )
      )
      .orderBy(desc(expenses.date));
    
    // Fetch all categories for lookup
    const categoryList = await db.select().from(categories);
    const categoryMap = new Map();
    categoryList.forEach((category) => {
      categoryMap.set(category.id, category);
    });
    
    // Enrich expenses with category information
    const enrichedExpenses = currentMonthExpenses.map((expense) => {
      const category = expense.categoryId ? categoryMap.get(expense.categoryId) : undefined;
      return {
        ...expense,
        category: category ? {
          name: category.name,
          icon: category.icon || '📊',
          color: category.color || '#9E9E9E',
          keywords: category.keywords || '',
        } : undefined
      };
    });
    
    // Calculate total spent so far this month
    const totalSpentSoFar = enrichedExpenses.reduce(
      (sum, expense) => sum + parseFloat(expense.amount.toString()), 
      0
    );
    
    // Group expenses by category
    const expensesByCategory = enrichedExpenses.reduce((acc: any, expense) => {
      const categoryId = expense.categoryId || 'uncategorized';
      const categoryName = expense.category?.name || 'Uncategorized';
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          id: categoryId,
          name: categoryName,
          icon: expense.category?.icon || '📊',
          color: expense.category?.color || '#9E9E9E',
          keywords: expense.category?.keywords || '',
          expenses: [],
          total: 0
        };
      }
      
      acc[categoryId].expenses.push({
        id: expense.id,
        description: expense.description,
        amount: parseFloat(expense.amount.toString()),
        date: expense.date,
        location: expense.location,
      });
      
      acc[categoryId].total += parseFloat(expense.amount.toString());
      
      return acc;
    }, {});
    
    // Get expense history for the last 3 months for better predictions
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const historicalExpenses = await db
      .select()
      .from(expenses)
      .where(
        and(
          gte(expenses.date, threeMonthsAgo),
          lte(expenses.date, startOfCurrentMonth)
        )
      )
      .orderBy(desc(expenses.date));
    
    // Enrich historical expenses
    const enrichedHistoricalExpenses = historicalExpenses.map((expense) => {
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

    // Create a context for the LLM that helps it make intelligent projections
    const prompt = `
You are an intelligent expense projection system for MoneyWhisper, a personal finance app. Your task is to analyze the user's spending patterns and provide realistic projections for the current month.

Today's date: ${format(today, 'MMMM d, yyyy')}
Days elapsed in current month: ${daysElapsedInMonth} out of ${totalDaysInMonth} days

Current month's expenses by category (so far):
${Object.values(expensesByCategory).map((cat: any) => 
  `${cat.name} (${cat.icon}): ₹${cat.total.toFixed(2)}
  Items: ${cat.expenses.map((exp: any) => `- ${exp.description}: ₹${exp.amount.toFixed(2)} (${format(new Date(exp.date), 'MMM d')})`).join('\n  ')}
`).join('\n')}

Total spent so far: ₹${totalSpentSoFar.toFixed(2)}

Based on this data, intelligently project the user's total spending for the full month. Consider:
1. Frequency patterns - Distinguish between daily, weekly, monthly expenses
2. One-time vs recurring purchases - Some items like cooking oil are typically bought once per month
3. Consumption patterns - Items like chicken or vegetables last a specific number of days
4. Regular bills that might be upcoming later in the month
5. Typical spending patterns based on category

For your projection, provide the following in JSON format only:
1. A total projected amount for the month
2. A brief analysis of the spending patterns (2-3 sentences)
3. A breakdown by category, including:
   - Current amount spent
   - Projected total by end of month
   - Brief reasoning for each projection

Format your response as valid JSON without any additional text or explanation:
{
  "totalProjection": number,
  "analysis": "string (2-3 sentence analysis)",
  "categories": [
    {
      "name": "string (category name)",
      "icon": "string (emoji icon)",
      "currentTotal": number,
      "projectedTotal": number,
      "reasoning": "string (brief explanation)"
    }
  ]
}

IMPORTANT: Return ONLY the JSON without any markdown formatting, explanation, or code blocks.
`;

    // Generate projections using the LLM
    const result = await generateText({
      model: google('gemini-1.5-flash'),
      prompt,
      temperature: 0.2,
      maxTokens: 1500,
    });
    
    let projectionData;
    try {
      // Clean up the response - remove any markdown code block syntax if present
      const cleanedResponse = result.text.trim()
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '')
        .replace(/^```\s*/g, '')
        .trim();
      
      // Parse the LLM response as JSON
      projectionData = JSON.parse(cleanedResponse);
      
      // Add additional info for the frontend
      projectionData.currentDate = format(today, 'MMMM d, yyyy');
      projectionData.daysRemaining = totalDaysInMonth - daysElapsedInMonth;
      projectionData.totalSpentSoFar = totalSpentSoFar;
      
      return NextResponse.json({
        success: true,
        projections: projectionData
      });
    } catch (err) {
      console.error('Error parsing LLM response:', err);
      console.error('Raw LLM response:', result.text);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to generate projections',
        rawResponse: result.text
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error generating expense projections:', error);
    return NextResponse.json(
      { error: 'Failed to generate expense projections. Please try again.' },
      { status: 500 }
    );
  }
} 