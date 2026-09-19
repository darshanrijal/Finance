import { createId } from '@paralleldrive/cuid2'
import { defineRelations } from 'drizzle-orm'
import {
  boolean,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

const id = text('id').primaryKey().notNull().$defaultFn(createId)
const timestamps = {
  createdAt: timestamp('created_at', {
    mode: 'date',
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', {
    mode: 'date',
    withTimezone: true,
  })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  currency: text('currency').default('NPR').notNull(),
  isRequiredOnboarding: boolean('is_required_onboarding')
    .default(true)
    .notNull(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const AccountTypeEnum = pgEnum('account_types', [
  'CASH',
  'CARD',
  'SAVINGS',
])

export const accounts = pgTable('money_accounts', {
  id,
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  type: AccountTypeEnum().notNull(),
  balance: numeric({ mode: 'number' }).notNull().default(0),
  isDefault: boolean('is_default').notNull().default(false),
  ...timestamps,
})

export const TransactionTypeEnum = pgEnum('transactions_type', [
  'INCOME',
  'EXPENSE',
])
export const TransactionInputMethods = pgEnum('transactions_input_method', [
  'MANUAL',
  'RECIPT_SCAN',
  'VOICE',
])
export const transactions = pgTable('transactions', {
  id,
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  type: TransactionTypeEnum().notNull(),
  amount: numeric({ mode: 'number' }).notNull(),
  category: text().notNull(),
  description: text(),
  date: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),
  status: text().notNull().default('COMPLETED'),
  inputMethod: TransactionInputMethods('input_method')
    .notNull()
    .default('MANUAL'),
  voiceTranscript: text('voice_transcript'),
  isFlagged: boolean('is_flagged').notNull().default(false),
  flagReason: text('flag_reason'),
  ...timestamps,
})

export const budgets = pgTable('bugdets', {
  id,
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
    .unique(),
  amount: numeric({ mode: 'number' }).notNull(),
  lastAlertSent: timestamp('last_alert_sent', {
    mode: 'date',
    withTimezone: true,
  }),
  lastAlertThreshold: numeric({ mode: 'number' }),
  ...timestamps,
})

export const relations = defineRelations(
  { user, session, accounts, account, transactions, budgets },
  (r) => ({
    user: {
      sessions: r.many.session(),
      accounts: r.many.account(),
      moneyAccounts: r.many.accounts(),
      transactions: r.many.transactions(),
      budget: r.one.budgets(),
    },

    session: {
      user: r.one.user({
        from: r.session.userId,
        to: r.user.id,
      }),
    },

    account: {
      user: r.one.user({
        from: r.account.userId,
        to: r.user.id,
      }),
    },

    accounts: {
      user: r.one.user({
        from: r.accounts.userId,
        to: r.user.id,
      }),
      transactions: r.many.transactions(),
    },

    transactions: {
      user: r.one.user({
        from: r.transactions.userId,
        to: r.user.id,
      }),
      account: r.one.accounts({
        from: r.transactions.accountId,
        to: r.accounts.id,
      }),
    },

    budgets: {
      user: r.one.user({
        from: r.budgets.userId,
        to: r.user.id,
      }),
    },
  }),
)
