import { pgTable, uuid, numeric, varchar, timestamp, index, integer, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./user.model";

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 100 }).notNull(),
    limitAmount: numeric("limit_amount", { precision: 14, scale: 2 }).notNull(),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("budgets_user_id_idx").on(table.userId),
    categoryIdx: index("budgets_category_idx").on(table.category),
    monthYearIdx: index("budgets_month_year_idx").on(table.month, table.year),
    uniqueUserCategoryMonthYear: unique("budgets_unique_user_category_month_year").on(
      table.userId,
      table.category,
      table.month,
      table.year
    ),
  })
);

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
}));

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
