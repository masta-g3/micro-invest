export interface InvestmentEntry {
  date: string
  investment: string
  amount: number
  rate: number
}

export interface PortfolioSnapshot {
  date: string
  entries: InvestmentEntry[]
  totalValue: number
  totalDebt: number
  netWorth: number
}

export interface PortfolioInsight {
  topPerformer: { name: string; growth: number }
  underperformer: { name: string; growth: number }
  monthlyChange: number
  allocation: Record<string, number>
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
  action?: {
    label: string
    handler: () => void
  }
}

export interface ImportResult {
  success: boolean
  data?: InvestmentEntry[]
  errors?: string[]
  count?: number
}

export interface ChartSettings {
  mainView: 'performance' | 'ownership'
  performanceView: 'cumulative' | 'period'
  ownershipView: 'allocation' | 'value'
  showByAsset: boolean
  displayMode: 'percentage' | 'absolute'
  visibleAssets: string[]
}

export interface FormData {
  date: string
  entries: Array<{
    investment: string
    amount: string
    rate: string
  }>
}

export type ViewMode = 'overview' | 'snapshot' | 'timeseries' | 'add'