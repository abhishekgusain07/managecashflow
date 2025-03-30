import { nanoid } from 'nanoid';
import { db } from './drizzle';
import { categories, defaultCategories } from './schema';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if categories already exist
    const existingCategories = await db.select().from(categories);
    
    if (existingCategories.length > 0) {
      console.log(`Database already has ${existingCategories.length} categories. Skipping seed.`);
      return;
    }

    // Insert all default categories
    const categoriesToInsert = defaultCategories.map(category => ({
      id: nanoid(),
      name: category.name,
      icon: category.icon,
      color: category.color,
      keywords: category.keywords,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(categories).values(categoriesToInsert);
    
    console.log(`Successfully seeded ${categoriesToInsert.length} categories`);
    categoriesToInsert.forEach(cat => {
      console.log(`- ${cat.name} (${cat.icon})`);
    });
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('Seeding completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  }); 