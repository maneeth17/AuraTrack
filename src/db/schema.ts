import { pgTable, text, timestamp, varchar, primaryKey } from 'drizzle-orm/pg-core';

export const habits = pgTable('habits', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: text('title').notNull(),
  description: text('description').default(''),
  category: varchar('category', { length: 100 }).notNull(),
  frequency: varchar('frequency', { length: 20 }).notNull().default('daily'),
  days: text('days').array().notNull(),
  color: varchar('color', { length: 20 }).notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const logs = pgTable('logs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  habitId: varchar('habit_id', { length: 255 }).notNull().references(() => habits.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 10 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.habitId, table.date] }),
  };
});
