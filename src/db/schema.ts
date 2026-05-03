import { pgTable, text, timestamp, varchar, unique, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  password: text('password'),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  shareId: text('share_id').unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  expires: timestamp('expires').notNull(),
}, (vt) => ({
  pk: unique('verification_tokens_pk').on(vt.identifier, vt.token),
}));

export const accounts = pgTable('accounts', {
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  pk: unique('accounts_pk').on(table.provider, table.providerAccountId),
}));

export const habits = pgTable('habits', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').default(''),
  category: varchar('category', { length: 100 }).notNull(),
  frequency: varchar('frequency', { length: 20 }).notNull().default('daily'),
  days: text('days').array().notNull(),
  color: varchar('color', { length: 20 }).notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  isFocusHabit: text('is_focus_habit').notNull().default('false'),
  targetCount: integer('target_count').notNull().default(1),
  currentCount: integer('current_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const logs = pgTable('logs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  habitId: varchar('habit_id', { length: 255 }).notNull().references(() => habits.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 10 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  count: integer('count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
  return {
    uniqueHabitDate: unique('unique_habit_date').on(table.habitId, table.date),
  };
});
