import { type ClassValue, clsx } from 'clsx'
import { formatDate } from 'date-fns'
import { Directory, File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { twMerge } from 'tailwind-merge'
import type { Transaction } from '@/constants/transaction'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value: number, currency: string = 'NPR') {
  const locale = currency === 'NPR' ? 'en-NP' : undefined
  return Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

// Number of calendar days of history included in the export.
const EXPORT_WINDOW_DAYS = 30

function toCsvCell(value: string | number | null) {
  if (value === null) return ''

  const str = String(value)

  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

function buildCsv(transactions: Transaction[]) {
  const header = [
    'Date',
    'Type',
    'Category',
    'Description',
    'Amount',
    'Input Method',
  ]

  const rows = transactions.map((tx) => [
    formatDate(tx.date, 'yyyy-MM-dd'),
    tx.type,
    tx.category,
    tx.description ?? '',
    tx.amount,
    tx.inputMethod,
  ])

  return [header, ...rows].map((row) => row.map(toCsvCell).join(',')).join('\n')
}

export async function exportTransactionsToCsv(transactions: Transaction[]) {
  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - EXPORT_WINDOW_DAYS)

  const recentTransactions = transactions.filter(
    (tx) => new Date(tx.date) >= cutoff,
  )

  const csv = buildCsv(recentTransactions)
  const fileName = `transactions-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`

  const file = new File(new Directory(Paths.cache), fileName)

  if (file.exists) {
    file.delete()
  }

  file.create()
  file.write(csv)

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export transactions',
      UTI: 'public.comma-separated-values-text',
    })
  }

  return {
    count: recentTransactions.length,
    uri: file.uri,
  }
}
