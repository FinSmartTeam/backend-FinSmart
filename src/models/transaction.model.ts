import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  timestamp,
  pgEnum,
  index,
  boolean
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./user.model";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
]);

export const transactionSourceEnum = pgEnum("transaction_source", [
  "manual",
  "ai",
  "import",
]);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    type: transactionTypeEnum("type").notNull(),

    amount: numeric("amount", {
      precision: 14,
      scale: 2,
    }).notNull(),

    category: varchar("category", {
      length: 100,
    }).notNull(),

    description: text("description"),

    merchantName: varchar("merchant_name", {
      length: 150,
    }),

    paymentMethod: varchar("payment_method", {
      length: 50,
    }),

    location: varchar("location", {
      length: 100,
    }),

    accountType: varchar("account_type", {
      length: 50,
    }),

    transactionTypeRaw: varchar("transaction_type_raw", {
      length: 50,
    }),

    deviceUsed: varchar("device_used", {
      length: 50,
    }),

    merchantType: varchar("merchant_type", {
      length: 100,
    }),

    loyaltyProgram: boolean("loyalty_program").default(false),

    timeOfDay: varchar("time_of_day", {
      length: 30,
    }),

    currency: varchar("currency", {
      length: 10,
    }).default("IDR"),

    transactionDate: timestamp("transaction_date", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    source: transactionSourceEnum("source").default("manual").notNull(),

    aiCategory: varchar("ai_category", {
      length: 100,
    }),

    confidenceScore: numeric("confidence_score", {
      precision: 5,
      scale: 2,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("transactions_user_id_idx").on(table.userId),
    index("transactions_type_idx").on(table.type),
    index("transactions_category_idx").on(table.category),
    index("transactions_date_idx").on(table.transactionDate),
  ]
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;