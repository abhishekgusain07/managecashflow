import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { nanoid } from 'nanoid';
import { categories, expenses } from '@/db/schema';

interface ExtractedData {
    description: string;
    amount: number;
    category?: string;
    location?: string;
  }
  
export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input. Please provide a valid expense description.' },
        { status: 400 }
      );
    }

    // Extract data from the text
    const extractedData = await extractDataFromText(text);
    
    if (!extractedData || !extractedData.description || !extractedData.amount) {
      return NextResponse.json(
        { error: 'Could not extract expense information. Please try a different format.' },
        { status: 400 }
      );
    }

    // Find the appropriate category based on the description
    const categoryId = await determineCategoryId(extractedData.description);

    // Create a new expense record
    const newExpense = {
      id: nanoid(),
      description: extractedData.description,
      amount: extractedData.amount.toString(),
      categoryId: categoryId || undefined,
      location: extractedData.location || null,
      date: new Date(),
      autoCategorized: true,
    };

    // Insert the expense into the database
    await db.insert(expenses).values(newExpense);

    return NextResponse.json({ 
      success: true, 
      expense: newExpense 
    });
    
  } catch (error) {
    console.error('Error processing expense:', error);
    return NextResponse.json(
      { error: 'Failed to process the expense. Please try again.' },
      { status: 500 }
    );
  }
}

// Simple function to extract data from text
// In a real implementation, you'd use Gemini or another AI service here
async function extractDataFromText(text: string): Promise<ExtractedData | null> {
  try {
    // Simple regex-based extraction as a fallback
    // Format expected: "[item] for [amount] rupees"
    const regex = /(.+) for (\d+(?:\.\d+)?) (?:rupees|rs|rupee|r)/i;
    const match = text.match(regex);

    if (match) {
      const [, description, amountStr] = match;
      const amount = parseFloat(amountStr);
      
      // Check if there's any location info (e.g., "at store")
      let location = null;
      const locationMatch = description.match(/ at (.+)$/i);
      const cleanDescription = locationMatch 
        ? description.replace(locationMatch[0], '').trim() 
        : description.trim();
      
      if (locationMatch) {
        location = locationMatch[1];
      }
      
      return { 
        description: cleanDescription,
        amount,
        location: location || undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting data:', error);
    return null;
  }
}

// Function to determine the appropriate category based on the description
async function determineCategoryId(description: string): Promise<string | undefined> {
  try {
    const allCategories = await db.select().from(categories);
    
    // Convert description to lowercase for case-insensitive matching
    const lowercaseDesc = description.toLowerCase();
    
    // Try to find a matching category based on keywords
    for (const category of allCategories) {
      if (!category.keywords) continue;
      
      const keywords = category.keywords.toLowerCase().split(',');
      for (const keyword of keywords) {
        if (lowercaseDesc.includes(keyword.trim())) {
          return category.id;
        }
      }
    }
    
    // If no match found, use the "Miscellaneous" category
    const miscCategory = allCategories.find(cat => cat.name === 'Miscellaneous');
    return miscCategory?.id;
    
  } catch (error) {
    console.error('Error determining category:', error);
    return undefined;
  }
} 