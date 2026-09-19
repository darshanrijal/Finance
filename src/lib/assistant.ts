import { Budget } from "@/constants/Budget";
import { type CategoryKey, getCategoryConfig } from "@/constants/categories";
import { Transaction } from "@/constants/transaction";
import { formatDate, isSameMonth, subDays } from "date-fns";
import { formatPrice } from "./utils";

export function buildContext(
  transactions: Transaction[],
  budget: Budget | null,
  currency: string,
) {
  const now = new Date();
  const cutoff = subDays(now, 30);
  const recent = transactions.filter((tx) => tx.date >= cutoff);
  const thisMonthExpense = transactions
    .filter((tx) => tx.type === "EXPENSE" && isSameMonth(tx.date, now))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const spentByCategory: Record<string, number> = {};
  let income = 0,
    expense = 0;

  recent.forEach((tx) => {
    if (tx.type === "EXPENSE") {
      expense += tx.amount;
      spentByCategory[tx.category] =
        spentByCategory[tx.category] ?? 0 + tx.amount;
    } else {
      income += tx.amount;
    }
  });
  const categoryLines = Object.entries(spentByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([category, amount]) =>
        `- ${getCategoryConfig(category as CategoryKey).label}: ${formatPrice(amount, currency)}`,
    )
    .join("\n");

  const budgetLine = budget
    ? `${formatPrice(thisMonthExpense, currency)} spent of ${formatPrice(
        budget.amount,
        currency,
      )} monthly budget`
    : "No monthly budget set.";

  const txLines = recent
    .slice(0, 40)
    .map(
      (tx) =>
        `- ${formatDate(tx.date, "d MMM yyyy")} | ${tx.type} | ${
          getCategoryConfig(tx.category as CategoryKey).label
        } | ${formatPrice(tx.amount, currency)}${
          tx.description ? ` | ${tx.description}` : ""
        }`,
    )
    .join("\n");

  return `Last 30 days summary:
Total income: ${formatPrice(income, currency)}
Total expense: ${formatPrice(expense, currency)}

Spending by category:
${categoryLines || "No expenses recorded."}

Monthly budget:
${budgetLine}

Recent transactions:
${txLines || "No transactions recorded."}`;
}
