import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const financialAccounts = sqliteTable("financial_accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // e.g. "Main Checking", "High-Yield Savings", "Emergency Fund"
  type: text("type").notNull().default("checking"), // 'checking' | 'savings' | 'investment' | 'cash'
  currentBalance: real("current_balance").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
  updatedAt: text("updated_at").notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => financialAccounts.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("expense"), // 'income' | 'expense' | 'transfer'
  amount: real("amount").notNull(),
  category: text("category").notNull().default("other"), 
  // Categories: 'salary' | 'freelance' | 'housing' | 'food' | 'tech_hardware' | 'software_subs' | 'education' | 'fitness' | 'leisure' | 'transport' | 'other'
  description: text("description").notNull(),
  date: text("date").notNull(), // ISO date YYYY-MM-DD
  isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const upcomingCashflows = sqliteTable("upcoming_cashflows", {
  id: text("id").primaryKey(),
  type: text("type").notNull().default("expense"), // 'income' | 'expense'
  title: text("title").notNull(), // e.g. "AWS Cloud Invoice", "GitHub Copilot / Cursor Sub", "Freelance Milestone 2"
  amount: real("amount").notNull(),
  expectedDate: text("expected_date").notNull(), // YYYY-MM-DD
  category: text("category").notNull().default("software_subs"),
  isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const wishlistItems = sqliteTable("wishlist_items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(), // e.g. "Keychron Q1 Pro Mechanical Keyboard"
  estimatedCost: real("estimated_cost").notNull(),
  savedAmount: real("saved_amount").notNull().default(0),
  priority: text("priority").notNull().default("medium"), // 'low' | 'medium' | 'high'
  targetDate: text("target_date"),
  notes: text("notes").notNull().default(""),
  url: text("url"),
  status: text("status").notNull().default("saving"), // 'planning' | 'saving' | 'ready_to_buy' | 'purchased' | 'abandoned'
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type NewFinancialAccount = typeof financialAccounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type UpcomingCashflow = typeof upcomingCashflows.$inferSelect;
export type NewUpcomingCashflow = typeof upcomingCashflows.$inferInsert;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type NewWishlistItem = typeof wishlistItems.$inferInsert;
