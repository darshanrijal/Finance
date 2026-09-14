import { trpc } from "@/__rpc/react";

export const useDeleteTransaction = () => {
  const utils = trpc.useUtils();
  return trpc.transactions.deleteTransaction.useMutation({
    onSuccess: () => {
      utils.budget.getBudget.invalidate();
      utils.transactions.getTransactions.invalidate();
      utils.accounts.getAccounts.invalidate();
    },
  });
};

export const useCreateTransaction = () => {
  const utils = trpc.useUtils();
  return trpc.transactions.addTransaction.useMutation({
    onSuccess: () => {
      utils.budget.getBudget.invalidate();
      utils.transactions.getTransactions.invalidate();
      utils.accounts.getAccounts.invalidate();
    },
  });
};
