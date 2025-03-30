import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { categories } from '@/db/schema';

export async function GET() {
  try {
    // Fetch all categories from the database
    const categoriesData = await db.select().from(categories);
    
    return NextResponse.json({
      categories: categoriesData.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '📊',
        color: cat.color || '#9E9E9E'
      }))
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
} 