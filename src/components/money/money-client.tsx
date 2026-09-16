"use client";

import * as React from "react";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
} from "lucide-react";
import {
  FinancialAccount,
  Transaction,
  UpcomingCashflow,
  WishlistItem,
} from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  createTransactionAction,
  deleteTransactionAction,
  createUpcomingCashflowAction,
  markCashflowPaidAction,
  createWishlistItemAction,
  updateWishlistSavedAction,
  deleteWishlistItemAction,
} from "@/lib/actions/money";
import { formatCurrency, formatDate } from "@/lib/utils";

interface MoneyClientProps {
  initialAccounts: FinancialAccount[];
  initialTransactions: Transaction[];
  initialUpcoming: UpcomingCashflow[];
  initialWishlist: WishlistItem[];
}

export function MoneyClient({
  initialAccounts,
  initialTransactions,
  initialUpcoming,
  initialWishlist,
}: MoneyClientProps) {
  const [accounts, setAccounts] = React.useState(initialAccounts);
  const [transactionsList, setTransactionsList] = React.useState(initialTransactions);
  const [upcomingList, setUpcomingList] = React.useState(initialUpcoming);
  const [wishlist, setWishlist] = React.useState(initialWishlist);

  // Modals
  const [isNewTxOpen, setIsNewTxOpen] = React.useState(false);
  const [isNewUpcomingOpen, setIsNewUpcomingOpen] = React.useState(false);
  const [isNewWishlistOpen, setIsNewWishlistOpen] = React.useState(false);

  // Transaction form
  const [txType, setTxType] = React.useState<"income" | "expense">("expense");
  const [txAmount, setTxAmount] = React.useState("");
  const [txAccountId, setTxAccountId] = React.useState(initialAccounts[0]?.id || "");
  const [txCategory, setTxCategory] = React.useState("food");
  const [txDesc, setTxDesc] = React.useState("");

  // Upcoming form
  const [upType, setUpType] = React.useState<"income" | "expense">("expense");
  const [upTitle, setUpTitle] = React.useState("");
  const [upAmount, setUpAmount] = React.useState("");
  const [upDate, setUpDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [upCat, setUpCat] = React.useState("software_subs");

  // Wishlist form
  const [wishTitle, setWishTitle] = React.useState("");
  const [wishCost, setWishCost] = React.useState("");
  const [wishSaved, setWishSaved] = React.useState("0");
  const [wishNotes, setWishNotes] = React.useState("");
  const [wishUrl, setWishUrl] = React.useState("");

  // Transactions Filter
  const [txFilter, setTxFilter] = React.useState<"all" | "expense" | "income">("all");

  // Calculations
  const totalBalance = accounts.reduce((acc, a) => acc + a.currentBalance, 0);

  // Month stats
  const nowStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const thisMonthTxs = transactionsList.filter((t) => t.date.startsWith(nowStr));
  const monthIncome = thisMonthTxs
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const monthExpenses = thisMonthTxs
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const netSavings = monthIncome - monthExpenses;

  // Primary checking balance for afford-check
  const primaryAccount = accounts.find((a) => a.isPrimary) || accounts[0];

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0 || !txDesc.trim()) return;

    await createTransactionAction({
      accountId: txAccountId,
      type: txType,
      amount: amt,
      category: txCategory,
      description: txDesc.trim(),
    });

    setTxAmount("");
    setTxDesc("");
    setIsNewTxOpen(false);
    window.location.reload();
  };

  const handleDeleteTx = async (id: string) => {
    if (confirm("Delete this transaction?")) {
      await deleteTransactionAction(id);
      window.location.reload();
    }
  };

  const handleCreateUpcoming = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(upAmount);
    if (isNaN(amt) || amt <= 0 || !upTitle.trim()) return;

    await createUpcomingCashflowAction({
      type: upType,
      title: upTitle.trim(),
      amount: amt,
      expectedDate: upDate,
      category: upCat,
    });

    setUpTitle("");
    setUpAmount("");
    setIsNewUpcomingOpen(false);
    window.location.reload();
  };

  const handleMarkPaid = async (cf: UpcomingCashflow) => {
    await markCashflowPaidAction(cf.id, primaryAccount?.id);
    window.location.reload();
  };

  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(wishCost);
    if (isNaN(cost) || cost <= 0 || !wishTitle.trim()) return;

    await createWishlistItemAction({
      title: wishTitle.trim(),
      estimatedCost: cost,
      savedAmount: parseFloat(wishSaved) || 0,
      notes: wishNotes.trim(),
      url: wishUrl.trim() || undefined,
    });

    setWishTitle("");
    setWishCost("");
    setWishSaved("0");
    setWishNotes("");
    setWishUrl("");
    setIsNewWishlistOpen(false);
    window.location.reload();
  };

  const handleAddSavings = async (item: WishlistItem) => {
    const addStr = prompt(`How much to allocate toward "${item.title}"?`, "50");
    if (!addStr) return;
    const addNum = parseFloat(addStr);
    if (!isNaN(addNum) && addNum > 0) {
      const nextSaved = item.savedAmount + addNum;
      await updateWishlistSavedAction(item.id, nextSaved);
      setWishlist((prev) =>
        prev.map((w) =>
          w.id === item.id
            ? {
                ...w,
                savedAmount: nextSaved,
                status: nextSaved >= item.estimatedCost ? "ready_to_buy" : "saving",
              }
            : w
        )
      );
    }
  };

  const handleDeleteWishlist = async (id: string) => {
    if (confirm("Remove item from wishlist?")) {
      await deleteWishlistItemAction(id);
      setWishlist((prev) => prev.filter((w) => w.id !== id));
    }
  };

  const filteredTransactions = transactionsList.filter((t) => {
    if (txFilter === "expense") return t.type === "expense";
    if (txFilter === "income") return t.type === "income";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">
            Personal Financial Awareness
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Calm cashflow visibility, upcoming forecasts, and planned purchases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsNewUpcomingOpen(true)}
            className="h-8 text-xs gap-1.5"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Upcoming Bill</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsNewTxOpen(true)}
            className="h-8 text-xs gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Transaction</span>
          </Button>
        </div>
      </div>

      {/* Top 4 Financial Awareness Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Net Worth */}
        <div className="p-4 rounded-lg bg-zinc-950/70 border border-zinc-800/80 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Total Net Balance
          </span>
          <div className="text-xl font-bold font-mono text-zinc-100">
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-[10px] text-zinc-500 font-mono">
            Across {accounts.length} liquid accounts
          </p>
        </div>

        {/* Metric 2: Monthly Income */}
        <div className="p-4 rounded-lg bg-zinc-950/70 border border-zinc-800/80 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/90 flex items-center gap-1">
            <ArrowDownLeft className="h-3 w-3" />
            This Month's Inflow
          </span>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {formatCurrency(monthIncome)}
          </div>
          <p className="text-[10px] text-zinc-500 font-mono">
            Deposits & earnings
          </p>
        </div>

        {/* Metric 3: Monthly Expenses */}
        <div className="p-4 rounded-lg bg-zinc-950/70 border border-zinc-800/80 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400/90 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" />
            This Month's Outflow
          </span>
          <div className="text-xl font-bold font-mono text-rose-400">
            {formatCurrency(monthExpenses)}
          </div>
          <p className="text-[10px] text-zinc-500 font-mono">
            Living expenses & subscriptions
          </p>
        </div>

        {/* Metric 4: Net Savings */}
        <div className="p-4 rounded-lg bg-zinc-950/70 border border-zinc-800/80 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-indigo-400" />
            Net Monthly Buffer
          </span>
          <div
            className={`text-xl font-bold font-mono ${
              netSavings >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatCurrency(netSavings)}
          </div>
          <p className="text-[10px] text-zinc-500 font-mono">
            {monthIncome > 0
              ? `${Math.round((netSavings / monthIncome) * 100)}% savings rate`
              : "No income logged"}
          </p>
        </div>
      </div>

      {/* Accounts Breakdown Strip */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
          Accounts & Liquid Balances
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-3 rounded-md bg-zinc-900/60 border border-zinc-800/70 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-xs font-medium text-zinc-200">
                    {acc.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 capitalize pl-5">
                  {acc.type}
                </span>
              </div>
              <span className="text-sm font-bold font-mono text-zinc-100">
                {formatCurrency(acc.currentBalance)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Cashflow Forecaster & Wishlist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Upcoming Cashflow Forecaster */}
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                Upcoming Cashflow Forecaster
              </h3>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsNewUpcomingOpen(true)}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Bill
            </Button>
          </div>

          <div className="space-y-2">
            {upcomingList.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-600 italic border border-dashed border-zinc-800/80 rounded-md">
                No upcoming bills or income scheduled.
              </div>
            ) : (
              upcomingList.map((cf) => (
                <div
                  key={cf.id}
                  className={`p-3 rounded-md border flex items-center justify-between text-xs transition-colors ${
                    cf.isPaid
                      ? "bg-zinc-900/30 border-zinc-800/40 opacity-50"
                      : "bg-zinc-950 border-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-200">
                        {cf.title}
                      </span>
                      <Badge variant="secondary" className="text-[9px] uppercase font-mono">
                        {cf.category}
                      </Badge>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Due: {formatDate(cf.expectedDate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono font-bold ${
                        cf.type === "income" ? "text-emerald-400" : "text-zinc-200"
                      }`}
                    >
                      {cf.type === "income" ? "+" : "-"}
                      {formatCurrency(cf.amount)}
                    </span>

                    {!cf.isPaid ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkPaid(cf)}
                        className="h-6 px-2 text-[10px] bg-zinc-900"
                        title="Mark paid and deduct balance"
                      >
                        Mark Paid
                      </Button>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-400">
                        Paid ✓
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Wishlist & Planned Purchases */}
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                Wishlist & Planned Purchases
              </h3>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsNewWishlistOpen(true)}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Target
            </Button>
          </div>

          <div className="space-y-3">
            {wishlist.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-600 italic border border-dashed border-zinc-800/80 rounded-md">
                No planned purchases saved.
              </div>
            ) : (
              wishlist.map((item) => {
                const pct = Math.min(
                  100,
                  Math.round((item.savedAmount / item.estimatedCost) * 100)
                );
                const canAffordImmediately =
                  (primaryAccount?.currentBalance || 0) > item.estimatedCost * 2;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-md bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700/80 transition-all space-y-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200">
                            {item.title}
                          </span>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-500 hover:text-zinc-300"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold font-mono text-zinc-100">
                          {formatCurrency(item.estimatedCost)}
                        </span>
                        <div className="text-[10px] font-mono text-zinc-500">
                          Saved: {formatCurrency(item.savedAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            pct >= 100 ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                        <span>{pct}% funded</span>
                        {canAffordImmediately ? (
                          <span className="text-emerald-400/90 font-medium">
                            ✓ Safe Buffer to Buy
                          </span>
                        ) : (
                          <span className="text-zinc-500">Continue saving</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/50">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddSavings(item)}
                        className="h-6 text-[10px] px-2 text-zinc-400 hover:text-zinc-100"
                      >
                        + Allocate Funds
                      </Button>

                      <button
                        onClick={() => handleDeleteWishlist(item.id)}
                        className="text-zinc-600 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Full Transactions Ledger */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
            Transaction Activity Ledger
          </h3>

          <div className="flex items-center gap-1.5">
            {[
              { id: "all", label: "All" },
              { id: "expense", label: "Expenses" },
              { id: "income", label: "Income" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTxFilter(f.id as any)}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                  txFilter === f.id
                    ? "bg-zinc-800 text-zinc-100 font-medium"
                    : "text-zinc-400 hover:bg-zinc-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-zinc-800/60 border border-zinc-800/60 rounded-md overflow-hidden bg-zinc-950">
          {filteredTransactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-zinc-600 italic">
              No transactions recorded.
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 flex items-center justify-between hover:bg-zinc-900/40 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === "income"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                    }`}
                  >
                    {tx.type === "income" ? (
                      <ArrowDownLeft className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">
                      {tx.description}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                      <span className="capitalize">{tx.category.replace("_", " ")}</span>
                      <span>&bull;</span>
                      <span>{formatDate(tx.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono font-bold ${
                      tx.type === "income"
                        ? "text-emerald-400"
                        : "text-zinc-200"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </span>
                  <button
                    onClick={() => handleDeleteTx(tx.id)}
                    className="text-zinc-600 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Transaction Dialog */}
      <Dialog open={isNewTxOpen} onOpenChange={setIsNewTxOpen}>
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Log Financial Transaction
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTx} className="space-y-3 pt-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTxType("expense")}
                className={`flex-1 py-1 text-xs rounded border transition-colors ${
                  txType === "expense"
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-300 font-medium"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setTxType("income")}
                className={`flex-1 py-1 text-xs rounded border transition-colors ${
                  txType === "income"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-medium"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400"
                }`}
              >
                Income
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Amount ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  required
                  autoFocus
                  className="text-xs bg-zinc-900/80 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Account
                </label>
                <select
                  value={txAccountId}
                  onChange={(e) => setTxAccountId(e.target.value)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (${a.currentBalance.toFixed(0)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Category
                </label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  <option value="food">Food & Dining</option>
                  <option value="software_subs">Software & Cloud</option>
                  <option value="tech_hardware">Hardware & Tech</option>
                  <option value="housing">Housing & Utilities</option>
                  <option value="fitness">Fitness</option>
                  <option value="salary">Salary</option>
                  <option value="freelance">Freelance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Description
                </label>
                <Input
                  placeholder="e.g. AWS Invoice, Whole Foods..."
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  required
                  className="text-xs bg-zinc-900/80"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsNewTxOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!txAmount || !txDesc.trim()}>
                Save Transaction
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Upcoming Cashflow Dialog */}
      <Dialog open={isNewUpcomingOpen} onOpenChange={setIsNewUpcomingOpen}>
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Schedule Upcoming Bill or Income
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUpcoming} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Type
                </label>
                <select
                  value={upType}
                  onChange={(e) => setUpType(e.target.value as any)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  <option value="expense">Upcoming Bill / Expense</option>
                  <option value="income">Expected Income / Payout</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Amount ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={upAmount}
                  onChange={(e) => setUpAmount(e.target.value)}
                  required
                  className="h-8 text-xs bg-zinc-900/80 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Title
              </label>
              <Input
                placeholder="e.g. AWS Cloud Invoice, Fiber Internet..."
                value={upTitle}
                onChange={(e) => setUpTitle(e.target.value)}
                required
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Expected Date
                </label>
                <input
                  type="date"
                  value={upDate}
                  onChange={(e) => setUpDate(e.target.value)}
                  required
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Category
                </label>
                <select
                  value={upCat}
                  onChange={(e) => setUpCat(e.target.value)}
                  className="h-8 w-full rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 outline-none"
                >
                  <option value="software_subs">Software & Cloud</option>
                  <option value="housing">Housing & Utilities</option>
                  <option value="freelance">Freelance</option>
                  <option value="fitness">Fitness</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsNewUpcomingOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!upTitle.trim() || !upAmount}>
                Schedule
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Wishlist Target Dialog */}
      <Dialog open={isNewWishlistOpen} onOpenChange={setIsNewWishlistOpen}>
        <DialogContent className="max-w-md p-5 bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              Add Planned Purchase Target
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateWishlist} className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Item Name
              </label>
              <Input
                placeholder="e.g. Keychron Q1 Pro Mechanical Keyboard"
                value={wishTitle}
                onChange={(e) => setWishTitle(e.target.value)}
                required
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Estimated Cost ($)
                </label>
                <Input
                  type="number"
                  step="1"
                  placeholder="200"
                  value={wishCost}
                  onChange={(e) => setWishCost(e.target.value)}
                  required
                  className="h-8 text-xs bg-zinc-900/80 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                  Currently Saved ($)
                </label>
                <Input
                  type="number"
                  step="1"
                  placeholder="0"
                  value={wishSaved}
                  onChange={(e) => setWishSaved(e.target.value)}
                  className="h-8 text-xs bg-zinc-900/80 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Product URL (optional)
              </label>
              <Input
                placeholder="https://..."
                value={wishUrl}
                onChange={(e) => setWishUrl(e.target.value)}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">
                Notes & Rationale
              </label>
              <Input
                placeholder="Why do I need this? What value does it add?"
                value={wishNotes}
                onChange={(e) => setWishNotes(e.target.value)}
                className="text-xs bg-zinc-900/80"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsNewWishlistOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!wishTitle.trim() || !wishCost}>
                Save Target
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
