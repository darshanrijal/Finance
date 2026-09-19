import {
  TransactionInputMethods,
  TransactionTypeEnum,
  transactions,
} from '@/server/db/schema'

export type TransactionType = (typeof TransactionTypeEnum)['enumValues'][number]
export type InputMethod = (typeof TransactionInputMethods)['enumValues'][number]
export type TransactionFilters = {
  type?: TransactionType | null
  accountId?: string | null
}
export type Transaction = typeof transactions.$inferSelect
