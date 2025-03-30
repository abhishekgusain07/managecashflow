import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db } from '@/db/drizzle';
import { categories, expenses, type Category } from '@/db/schema';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

interface ExtractedData {
  description: string;
  amount: number;
  categoryId?: string;
  location?: string | undefined;
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

    // Get all categories from the database
    const allCategories = await db.select().from(categories);
    
    // Extract data and determine category using AI
    const result = await processExpenseWithAI(text, allCategories);
    
    if (!result || !result.description || !result.amount) {
      return NextResponse.json(
        { error: 'Could not extract expense information. Please try a different format.' },
        { status: 400 }
      );
    }

    // Create a new expense record
    const newExpense = {
      id: nanoid(),
      description: result.description,
      amount: result.amount.toString(),
      categoryId: result.categoryId,
      location: result.location,
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

// Process expense text with AI to extract data and determine category
async function processExpenseWithAI(text: string, allCategories: Category[]): Promise<ExtractedData | null> {
  let generatedText = '';  // Declare here to fix the linter error
  try {
    // Format categories for the AI prompt
    const categoryOptions = allCategories.map(cat => 
      `${cat.name} (${cat.icon}): ${cat.keywords}`
    ).join('\n');
    
    // Create the prompt for the AI with function calling instructions
    const prompt = `
You are an expense processing assistant for the MoneyWhisper app. Your task is to extract information from user input and categorize it.

User expense text: "${text}"

Available categories:
${categoryOptions}

Please extract and return the following information as a valid JSON object:
1. description: The item or service purchased (without "for X rupees" or location info)
2. amount: The amount spent as a number (without currency symbol)
3. location: The location if mentioned (or null if not mentioned)
4. categoryName: The most appropriate category name from the list above

For example, if the user says "pizza for 300 rupees at Dominos", you should return:
{
  "description": "pizza",
  "amount": 300,
  "location": "Dominos",
  "categoryName": "Dining Out"
}

If the user says "eggs for 55", you should return:
{
  "description": "eggs",
  "amount": 55,
  "location": null,
  "categoryName": "Groceries"
}

Important: Return ONLY the JSON object without any markdown formatting, code blocks, or additional text.`;

    // Use Vercel AI SDK to generate text with Gemini
    const response = await generateText({
      model: google('gemini-1.5-flash'),
      prompt,
      temperature: 0.1, // Lower temperature for more deterministic results
    });
    
    generatedText = response.text;
    
    // Clean up the response - remove any markdown code block syntax
    const cleanedResponse = generatedText.trim()
      .replace(/```json\s*/g, '')
      .replace(/```\s*$/g, '')
      .replace(/^```\s*/g, '')
      .trim();
    
    // Parse the cleaned AI response as JSON
    const aiResponse = JSON.parse(cleanedResponse);
    
    // Find the category ID based on the category name
    const matchedCategory = allCategories.find(cat => 
      cat.name.toLowerCase() === aiResponse.categoryName.toLowerCase()
    );
    
    // Add fallback to Miscellaneous if no category match
    let categoryId = matchedCategory?.id;
    if (!categoryId) {
      const miscCategory = allCategories.find(cat => cat.name === 'Miscellaneous');
      categoryId = miscCategory?.id;
    }
    
    // Return the extracted data with the category ID
    return {
      description: aiResponse.description,
      amount: aiResponse.amount,
      location: aiResponse.location || undefined,
      categoryId: categoryId
    };
  } catch (error) {
    console.error('Error processing expense with AI:', error);
    console.error('Raw AI response:', generatedText);
    return null;
  }
} 