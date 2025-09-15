import { InvestmentEntry, PortfolioSnapshot } from '../types'
import { Decimal } from 'decimal.js'

// Configure Decimal.js for financial precision
Decimal.set({ precision: 28, rounding: 4 })

export interface AssetPerformance {
  asset: string
  currentValue: number
  initialValue: number
  totalGrowth: number
  growthPercentage: number
  monthlyGrowthRate: number
}

export interface PortfolioMetrics {
  totalReturn: number
  totalReturnPercentage: number
  monthlyGrowthRate: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  bestMonth: { date: string; return: number }
  worstMonth: { date: string; return: number }
}

export const calculateCompoundGrowth = (principal: number, rate: number, periods: number): number => {
  const p = new Decimal(principal)
  const r = new Decimal(rate).div(100)
  const result = p.mul(r.plus(1).pow(periods))
  return result.toNumber()
}

export const calculateAssetPerformance = (
  entries: InvestmentEntry[], 
  assetName: string
): AssetPerformance | null => {
  const assetEntries = entries
    .filter(entry => entry.investment === assetName)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (assetEntries.length === 0) return null

  const firstEntry = assetEntries[0]
  const lastEntry = assetEntries[assetEntries.length - 1]

  const initialValue = firstEntry.amount
  const currentValue = lastEntry.amount
  const totalGrowth = currentValue - initialValue
  const growthPercentage = initialValue !== 0 ? (totalGrowth / Math.abs(initialValue)) * 100 : 0

  // Calculate average monthly growth rate
  const months = assetEntries.length - 1
  const monthlyGrowthRate = months > 0 
    ? Math.pow(currentValue / Math.abs(initialValue), 1 / months) - 1 
    : 0

  return {
    asset: assetName,
    currentValue,
    initialValue,
    totalGrowth,
    growthPercentage,
    monthlyGrowthRate: monthlyGrowthRate * 100
  }
}

export const calculatePortfolioMetrics = (snapshots: PortfolioSnapshot[]): PortfolioMetrics => {
  if (snapshots.length < 2) {
    return {
      totalReturn: 0,
      totalReturnPercentage: 0,
      monthlyGrowthRate: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      bestMonth: { date: '', return: 0 },
      worstMonth: { date: '', return: 0 }
    }
  }

  const sortedSnapshots = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  const firstSnapshot = sortedSnapshots[0]
  const lastSnapshot = sortedSnapshots[sortedSnapshots.length - 1]

  // Calculate total return
  const totalReturn = lastSnapshot.netWorth - firstSnapshot.netWorth
  const totalReturnPercentage = firstSnapshot.netWorth !== 0 
    ? (totalReturn / Math.abs(firstSnapshot.netWorth)) * 100 
    : 0

  // Calculate monthly returns
  const monthlyReturns: number[] = []
  let bestMonth = { date: '', return: -Infinity }
  let worstMonth = { date: '', return: Infinity }

  for (let i = 1; i < sortedSnapshots.length; i++) {
    const prevSnapshot = sortedSnapshots[i - 1]
    const currentSnapshot = sortedSnapshots[i]
    
    const monthlyReturn = prevSnapshot.netWorth !== 0
      ? ((currentSnapshot.netWorth - prevSnapshot.netWorth) / Math.abs(prevSnapshot.netWorth)) * 100
      : 0

    monthlyReturns.push(monthlyReturn)

    if (monthlyReturn > bestMonth.return) {
      bestMonth = { date: currentSnapshot.date, return: monthlyReturn }
    }
    if (monthlyReturn < worstMonth.return) {
      worstMonth = { date: currentSnapshot.date, return: monthlyReturn }
    }
  }

  // Calculate average monthly growth rate
  const periods = sortedSnapshots.length - 1
  const monthlyGrowthRate = periods > 0
    ? (Math.pow(lastSnapshot.netWorth / Math.abs(firstSnapshot.netWorth), 1 / periods) - 1) * 100
    : 0

  // Calculate volatility (standard deviation of monthly returns)
  const avgMonthlyReturn = monthlyReturns.reduce((sum, ret) => sum + ret, 0) / monthlyReturns.length
  const variance = monthlyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgMonthlyReturn, 2), 0) / monthlyReturns.length
  const volatility = Math.sqrt(variance)

  // Calculate Sharpe ratio (assuming 0% risk-free rate)
  const sharpeRatio = volatility !== 0 ? avgMonthlyReturn / volatility : 0

  // Calculate maximum drawdown
  let maxDrawdown = 0
  let peak = firstSnapshot.netWorth

  for (const snapshot of sortedSnapshots) {
    if (snapshot.netWorth > peak) {
      peak = snapshot.netWorth
    }
    const drawdown = peak !== 0 ? ((peak - snapshot.netWorth) / peak) * 100 : 0
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }

  return {
    totalReturn,
    totalReturnPercentage,
    monthlyGrowthRate,
    volatility,
    sharpeRatio,
    maxDrawdown,
    bestMonth,
    worstMonth
  }
}

export const calculateAllocation = (snapshot: PortfolioSnapshot): Record<string, number> => {
  const allocation: Record<string, number> = {}
  const positiveEntries = snapshot.entries.filter(entry => entry.amount > 0)
  
  positiveEntries.forEach(entry => {
    const percentage = (entry.amount / snapshot.totalValue) * 100
    allocation[entry.investment] = percentage
  })

  return allocation
}

export const calculateGrowthFromPrevious = (
  currentSnapshot: PortfolioSnapshot,
  previousSnapshot: PortfolioSnapshot
): number => {
  if (previousSnapshot.netWorth === 0) return 0
  return ((currentSnapshot.netWorth - previousSnapshot.netWorth) / Math.abs(previousSnapshot.netWorth)) * 100
}

export const calculateProjectedValue = (
  currentValue: number,
  monthlyGrowthRate: number,
  months: number
): number => {
  const currentDecimal = new Decimal(currentValue)
  const rateDecimal = new Decimal(monthlyGrowthRate).div(100)
  const result = currentDecimal.mul(rateDecimal.plus(1).pow(months))
  return result.toNumber()
}

export const calculateBreakEvenMonth = (
  debtAmount: number,
  monthlyPayment: number,
  monthlyGrowthRate: number
): number | null => {
  if (monthlyPayment <= 0 || monthlyGrowthRate >= monthlyPayment) return null
  
  const debt = new Decimal(Math.abs(debtAmount))
  const payment = new Decimal(monthlyPayment)
  const rate = new Decimal(monthlyGrowthRate).div(100)
  
  // Formula for break-even calculation with compound interest
  // debt * (1 + rate)^n = payment * ((1 + rate)^n - 1) / rate
  
  let months = 0
  let remainingDebt = debt
  
  while (remainingDebt.gt(0) && months < 1000) { // Safety limit
    const interest = remainingDebt.mul(rate)
    remainingDebt = remainingDebt.plus(interest).minus(payment)
    months++
    
    if (remainingDebt.lte(0)) break
  }
  
  return months < 1000 ? months : null
}

export const formatCurrency = (amount: number, compact: boolean = false): string => {
  const absAmount = Math.abs(amount)
  
  if (compact && absAmount >= 1000) {
    if (absAmount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`
    }
    if (absAmount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k`
    }
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatPercentage = (percentage: number, decimals: number = 1): string => {
  const sign = percentage >= 0 ? '+' : ''
  return `${sign}${percentage.toFixed(decimals)}%`
}

export const formatGrowth = (growth: number): string => {
  const sign = growth >= 0 ? '+' : ''
  return `${sign}${formatCurrency(growth)}`
}

export const calculateRiskLevel = (volatility: number): 'Low' | 'Medium' | 'High' => {
  if (volatility < 5) return 'Low'
  if (volatility < 15) return 'Medium'
  return 'High'
}

export const getDiversificationScore = (allocation: Record<string, number>): number => {
  const values = Object.values(allocation)
  const n = values.length
  
  if (n <= 1) return 0
  
  // Calculate Herfindahl-Hirschman Index (HHI)
  const hhi = values.reduce((sum, percentage) => sum + Math.pow(percentage, 2), 0)
  
  // Normalize HHI to 0-100 scale (100 = perfectly diversified)
  const maxHhi = 10000 / n // Maximum HHI for n assets
  const normalizedScore = ((maxHhi - hhi) / (maxHhi - (10000 / n))) * 100
  
  return Math.max(0, Math.min(100, normalizedScore))
}

export const calculateSnapshot = (entries: InvestmentEntry[], date: string): PortfolioSnapshot => {
  const dateEntries = entries.filter(entry => entry.date === date)
  
  const totalValue = dateEntries
    .filter(entry => entry.amount > 0)
    .reduce((sum, entry) => sum + entry.amount, 0)
  
  const totalDebt = Math.abs(dateEntries
    .filter(entry => entry.amount < 0)
    .reduce((sum, entry) => sum + entry.amount, 0))
  
  const netWorth = totalValue - totalDebt
  
  return {
    date,
    entries: dateEntries,
    totalValue,
    totalDebt,
    netWorth
  }
}

export const calculateInsight = (snapshot: PortfolioSnapshot, previousSnapshot?: PortfolioSnapshot) => {
  const positiveEntries = snapshot.entries.filter(entry => entry.amount > 0)

  // Find top and underperformer by actual return
  let topPerformer = { name: '', growth: -Infinity }
  let underperformer = { name: '', growth: Infinity }

  positiveEntries.forEach(entry => {
    const previousEntry = previousSnapshot?.entries.find(e => e.investment === entry.investment)
    const actualReturn = calculateActualReturn(entry.amount, previousEntry?.amount)

    // Only consider entries with actual calculated returns
    if (actualReturn !== null) {
      if (actualReturn > topPerformer.growth) {
        topPerformer = { name: entry.investment, growth: actualReturn }
      }
      if (actualReturn < underperformer.growth) {
        underperformer = { name: entry.investment, growth: actualReturn }
      }
    }
  })
  
  // Calculate monthly change
  const monthlyChange = previousSnapshot 
    ? ((snapshot.netWorth - previousSnapshot.netWorth) / previousSnapshot.netWorth) * 100
    : 0
  
  // Calculate allocation
  const allocation: Record<string, number> = {}
  positiveEntries.forEach(entry => {
    allocation[entry.investment] = (entry.amount / snapshot.totalValue) * 100
  })
  
  return {
    topPerformer,
    underperformer,
    monthlyChange,
    allocation
  }
}

export const calculateActualReturn = (
  currentAmount: number,
  previousAmount: number | undefined
): number | null => {
  if (!previousAmount || previousAmount === 0) return null
  return ((currentAmount - previousAmount) / Math.abs(previousAmount)) * 100
} 