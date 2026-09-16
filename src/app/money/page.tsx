import { getMoneyData } from "@/lib/actions/money";
import { MoneyClient } from "@/components/money/money-client";

export const dynamic = "force-dynamic";

export default async function MoneyPage() {
  const data = await getMoneyData();

  return (
    <div className="space-y-4">
      <MoneyClient
        initialAccounts={data.accounts}
        initialTransactions={data.transactions}
        initialUpcoming={data.upcomingCashflows}
        initialWishlist={data.wishlistItems}
      />
    </div>
  );
}
