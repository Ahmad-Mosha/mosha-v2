"use server";

import { db } from "@/lib/db";
import {
  financialAccounts,
  transactions,
  upcomingCashflows,
  wishlistItems,
} from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

export async function getMoneyData() {
  const accounts = await db.select().from(financialAccounts).orderBy(desc(financialAccounts.isPrimary), asc(financialAccounts.name));
  const txs = await db.select().from(transactions).orderBy(desc(transactions.date), desc(transactions.createdAt));
  const upcoming = await db.select().from(upcomingCashflows).orderBy(asc(upcomingCashflows.expectedDate));
  const wishlist = await db.select().from(wishlistItems).orderBy(desc(wishlistItems.priority), asc(wishlistItems.createdAt));

  return {
    accounts,
    transactions: txs,
    upcomingCashflows: upcoming,
    wishlistItems: wishlist,
  };
}

export async function createAccountAction(data: {
  name: string;
  type: "checking" | "savings" | "investment" | "cash";
  currentBalance: number;
  currency?: string;
  isPrimary?: boolean;
}) {
  const id = genId("acc");
  const now = new Date().toISOString();

  await db.insert(financialAccounts).values({
    id,
    name: data.name.trim(),
    type: data.type,
    currentBalance: data.currentBalance,
    currency: data.currency || "USD",
    isPrimary: data.isPrimary || false,
    updatedAt: now,
  });

  revalidatePath("/money");
  revalidatePath("/");
  return { success: true, id };
}

export async function createTransactionAction(data: {
  accountId: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date?: string;
  isRecurring?: boolean;
}) {
  const id = genId("tx");
  const now = new Date().toISOString();
  const txDate = data.date || now.split("T")[0];

  await db.insert(transactions).values({
    id,
    accountId: data.accountId,
    type: data.type,
    amount: data.amount,
    category: data.category,
    description: data.description.trim(),
    date: txDate,
    isRecurring: data.isRecurring || false,
    createdAt: now,
  });

  // Adjust balance
  const account = (
    await db.select().from(financialAccounts).where(eq(financialAccounts.id, data.accountId))
  )[0];

  if (account) {
    const delta = data.type === "income" ? data.amount : -data.amount;
    await db
      .update(financialAccounts)
      .set({
        currentBalance: account.currentBalance + delta,
        updatedAt: now,
      })
      .where(eq(financialAccounts.id, data.accountId));
  }

  revalidatePath("/money");
  revalidatePath("/");
  return { success: true, id };
}

export async function deleteTransactionAction(txId: string) {
  const tx = (
    await db.select().from(transactions).where(eq(transactions.id, txId))
  )[0];

  if (tx) {
    // Reverse balance effect
    const account = (
      await db.select().from(financialAccounts).where(eq(financialAccounts.id, tx.accountId))
    )[0];

    if (account) {
      const delta = tx.type === "income" ? -tx.amount : tx.amount;
      await db
        .update(financialAccounts)
        .set({
          currentBalance: account.currentBalance + delta,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(financialAccounts.id, tx.accountId));
    }

    await db.delete(transactions).where(eq(transactions.id, txId));
  }

  revalidatePath("/money");
  revalidatePath("/");
  return { success: true };
}

export async function createUpcomingCashflowAction(data: {
  type: "income" | "expense";
  title: string;
  amount: number;
  expectedDate: string;
  category: string;
}) {
  const id = genId("cf");
  const now = new Date().toISOString();

  await db.insert(upcomingCashflows).values({
    id,
    type: data.type,
    title: data.title.trim(),
    amount: data.amount,
    expectedDate: data.expectedDate,
    category: data.category,
    isPaid: false,
    createdAt: now,
  });

  revalidatePath("/money");
  revalidatePath("/");
  return { success: true, id };
}

export async function markCashflowPaidAction(cfId: string, accountId?: string) {
  const cf = (
    await db.select().from(upcomingCashflows).where(eq(upcomingCashflows.id, cfId))
  )[0];

  if (cf) {
    await db
      .update(upcomingCashflows)
      .set({ isPaid: true })
      .where(eq(upcomingCashflows.id, cfId));

    // If account provided, convert to actual transaction
    if (accountId) {
      await createTransactionAction({
        accountId,
        type: cf.type as "income" | "expense",
        amount: cf.amount,
        category: cf.category,
        description: cf.title,
        date: new Date().toISOString().split("T")[0],
      });
    }
  }

  revalidatePath("/money");
  revalidatePath("/");
  return { success: true };
}

export async function createWishlistItemAction(data: {
  title: string;
  estimatedCost: number;
  savedAmount?: number;
  priority?: "low" | "medium" | "high";
  targetDate?: string;
  notes?: string;
  url?: string;
}) {
  const id = genId("wish");
  const now = new Date().toISOString();

  await db.insert(wishlistItems).values({
    id,
    title: data.title.trim(),
    estimatedCost: data.estimatedCost,
    savedAmount: data.savedAmount || 0,
    priority: data.priority || "medium",
    targetDate: data.targetDate || null,
    notes: data.notes?.trim() || "",
    url: data.url?.trim() || null,
    status:
      (data.savedAmount || 0) >= data.estimatedCost ? "ready_to_buy" : "saving",
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/money");
  return { success: true, id };
}

export async function updateWishlistSavedAction(itemId: string, savedAmount: number) {
  const now = new Date().toISOString();
  const item = (
    await db.select().from(wishlistItems).where(eq(wishlistItems.id, itemId))
  )[0];

  if (item) {
    const status =
      savedAmount >= item.estimatedCost ? "ready_to_buy" : "saving";
    await db
      .update(wishlistItems)
      .set({ savedAmount, status, updatedAt: now })
      .where(eq(wishlistItems.id, itemId));
  }

  revalidatePath("/money");
  return { success: true };
}

export async function deleteWishlistItemAction(itemId: string) {
  await db.delete(wishlistItems).where(eq(wishlistItems.id, itemId));
  revalidatePath("/money");
  return { success: true };
}
