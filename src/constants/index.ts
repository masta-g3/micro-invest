export const INVESTMENT_OPTIONS = [
  'Wealthfront',
  'IRA',
  'Robinhood',
  'CETES',
  'Crypto',
  'Real Estate',
  'Roth IRA',
  'Debt'
] as const

export const CSV_HEADERS = {
  DATE: 'Date',
  INVESTMENT: 'Investment',
  AMOUNT: 'Amount',
  RATE: 'Rate'
} as const

export const TOAST_DURATION = 3000
export const MAX_IMPORT_ERRORS = 5