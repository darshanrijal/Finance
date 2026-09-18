import { trpc } from "@/__rpc/react";

export function useCreateAccount() {
  const utils = trpc.useUtils();
  const createAccountMutation = trpc.accounts.createAccount.useMutation({
    onSuccess: () => {
      utils.accounts.getAccounts.invalidate();
      utils.budget.getBudget.invalidate();
    },
  });

  return createAccountMutation;
}
export function useUpdateAccount() {
  const utils = trpc.useUtils();
  const updateAccountMutation = trpc.accounts.updateAccount.useMutation({
    onSuccess: () => {
      utils.accounts.getAccounts.invalidate();
    },
  });

  return updateAccountMutation;
}
export function useDeleteAccount() {
  const utils = trpc.useUtils();
  const deleteAccountMutation = trpc.accounts.deleteAccount.useMutation({
    onSuccess: () => {
      utils.accounts.getAccounts.invalidate();
      utils.transactions.getTransactions.invalidate();
      utils.budget.getBudget.invalidate();
    },
  });

  return deleteAccountMutation;
}
export function useSetDefaultAccount() {
  const utils = trpc.useUtils();
  const setDefaultAccountMutation = trpc.accounts.setDefaultAccount.useMutation(
    {
      onSuccess: () => {
        utils.accounts.getAccounts.invalidate();
      },
    },
  );

  return setDefaultAccountMutation;
}
