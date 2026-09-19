import { budgets } from '@/server/db/schema'

export type Budget = typeof budgets.$inferSelect
