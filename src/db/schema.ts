import { pgEnum, pgTable, serial, text, timestamp, uniqueIndex, boolean, integer, numeric } from "drizzle-orm/pg-core";
// Categories table
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  icon: text('icon'), // Optional icon for the category
  color: text('color'), // Optional color code for the category
  keywords: text('keywords'), // Keywords to help with automatic categorization
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Expenses table
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  categoryId: text('category_id').references(() => categories.id),
  date: timestamp('date').defaultNow().notNull(),
  paymentMethod: text('payment_method'),
  location: text('location'),
  notes: text('notes'),
  autoCategorized: boolean('auto_categorized').default(true), // Flag to indicate if categorized automatically
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


// Common categories seed data with keywords for auto-categorization
export const defaultCategories = [
  { 
    name: 'Groceries', 
    icon: '🛒', 
    color: '#4CAF50',
    keywords: 'grocery,food,fruit,vegetable,milk,bread,cheese,yogurt,curd,rice,flour,oil,spice,cereal,meat'
  },
  { 
    name: 'Dining Out', 
    icon: '🍽️', 
    color: '#FF9800',
    keywords: 'restaurant,cafe,dining,lunch,dinner,breakfast,takeout,delivery,coffee,tea,bar,pub,snack'
  },
  { 
    name: 'Transportation', 
    icon: '🚗', 
    color: '#2196F3',
    keywords: 'fuel,petrol,diesel,gas,uber,taxi,cab,bus,train,metro,subway,fare,ticket,auto,rickshaw,ola'
  },
  { 
    name: 'Entertainment', 
    icon: '🎬', 
    color: '#9C27B0',
    keywords: 'movie,cinema,theatre,concert,show,game,event,ticket,streaming,subscription,netflix,amazon,disney'
  },
  { 
    name: 'Shopping', 
    icon: '🛍️', 
    color: '#E91E63',
    keywords: 'clothes,clothing,shoes,dress,shirt,pants,accessories,bag,purse,electronics,gadget,phone'
  },
  { 
    name: 'Utilities', 
    icon: '💡', 
    color: '#607D8B',
    keywords: 'electricity,water,gas,bill,internet,wifi,broadband,phone,mobile,recharge,dth,cable'
  },
  { 
    name: 'Health', 
    icon: '💊', 
    color: '#F44336',
    keywords: 'medicine,doctor,medical,hospital,clinic,pharmacy,health,checkup,test,insurance,consultation'
  },
  { 
    name: 'Housing', 
    icon: '🏠', 
    color: '#795548',
    keywords: 'rent,maintenance,repair,furniture,appliance,decor,cleaning,property,housing,apartment'
  },
  { 
    name: 'Personal Care', 
    icon: '✂️', 
    color: '#FF5722',
    keywords: 'haircut,salon,spa,grooming,cosmetics,skincare,makeup,beauty,hygiene,personal'
  },
  { 
    name: 'Education', 
    icon: '📚', 
    color: '#009688',
    keywords: 'book,course,class,tuition,fee,school,college,university,tutorial,learning,online,study'
  },
  { 
    name: 'Miscellaneous', 
    icon: '📦', 
    color: '#9E9E9E',
    keywords: 'other,misc,miscellaneous,general,various,random,donation,gift'
  }
];

// Types for TypeScript
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
