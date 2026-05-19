import { pgTable, uuid, numeric, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./user.model";

export const financialProfiles = pgTable(
  "financial_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    monthlyIncome: numeric("monthly_income", { precision: 14, scale: 2 }).default("0"),
    savingsTarget: numeric("savings_target", { precision: 14, scale: 2 }).default("0"),
    totalSavings: numeric("total_savings", { precision: 14, scale: 2 }).default("0"),
    riskLevel: varchar("risk_level", { length: 30 }),
    financialGoal: text("financial_goal"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("financial_profiles_user_id_idx").on(table.userId),
  })
);

export const financialProfilesRelations = relations(financialProfiles, ({ one }) => ({
  user: one(users, {
    fields: [financialProfiles.userId],
    references: [users.id],
  }),
}));

export type FinancialProfile = typeof financialProfiles.$inferSelect;
export type NewFinancialProfile = typeof financialProfiles.$inferInsert;
