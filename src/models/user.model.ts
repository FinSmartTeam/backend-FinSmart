import { pgTable, uuid, text, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: text('full_name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: varchar('role', { length: 20 }).default('user').notNull(),
  profilePicture: text('profile_picture').default('profile.png'),
  isActive: boolean('is_active').default(false),
  activationCode: varchar('activation_code', { length: 6 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});