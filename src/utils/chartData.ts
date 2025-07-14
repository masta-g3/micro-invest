import { PortfolioSnapshot } from '../types'
import { format } from 'date-fns'

export type DataType = 'returns' | 'portfolio' | 'allocation'
export type TimeView = 'cumulative' | 'period'
export type DisplayMode = 'percentage' | 'absolute'
export type AssetView = 'individual' | 'total'

export interface ChartDataPoint {
  date: string
  total: number
  assets: Record<string, number>
}

const formatDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), 'yyyy-MM')
  } catch {
    return dateStr
  }
}

export const transformSnapshots = (
  snapshots: PortfolioSnapshot[], 
  dataType: DataType, 
  timeView: TimeView,
  displayMode: DisplayMode = 'percentage'
): ChartDataPoint[] => {
  const sortedSnapshots = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  
  if (sortedSnapshots.length === 0) return []

  switch (dataType) {
    case 'returns':
      return calculateReturns(sortedSnapshots, timeView, displayMode)
    case 'portfolio':
      return calculatePortfolioValues(sortedSnapshots, timeView)
    case 'allocation':
      return calculateAllocation(sortedSnapshots)
    default:
      return []
  }
}

const calculateReturns = (snapshots: PortfolioSnapshot[], timeView: TimeView, displayMode: DisplayMode): ChartDataPoint[] => {
  const firstSnapshot = snapshots[0]
  
  return snapshots.map((snapshot, index) => {
    const date = formatDate(snapshot.date)
    
    if (timeView === 'cumulative') {
      // Cumulative returns since start
      const totalReturn = displayMode === 'absolute'
        ? snapshot.netWorth - firstSnapshot.netWorth
        : firstSnapshot.netWorth !== 0 
          ? ((snapshot.netWorth - firstSnapshot.netWorth) / Math.abs(firstSnapshot.netWorth)) * 100
          : 0

      const assets: Record<string, number> = {}
      
      // Calculate cumulative return for each asset
      snapshot.entries.filter(e => e.amount > 0).forEach(entry => {
        const firstEntry = firstSnapshot.entries.find(e => e.investment === entry.investment)
        if (firstEntry && firstEntry.amount > 0) {
          assets[entry.investment] = displayMode === 'absolute'
            ? entry.amount - firstEntry.amount
            : ((entry.amount - firstEntry.amount) / firstEntry.amount) * 100
        } else {
          assets[entry.investment] = displayMode === 'absolute' ? entry.amount : 0
        }
      })

      return { date, total: totalReturn, assets }
    } else {
      // Period (monthly) returns
      const prevSnapshot = index > 0 ? snapshots[index - 1] : snapshot
      const monthlyReturn = displayMode === 'absolute'
        ? snapshot.netWorth - prevSnapshot.netWorth
        : prevSnapshot.netWorth !== 0
          ? ((snapshot.netWorth - prevSnapshot.netWorth) / Math.abs(prevSnapshot.netWorth)) * 100
          : 0

      const assets: Record<string, number> = {}
      
      snapshot.entries.filter(e => e.amount > 0).forEach(entry => {
        const prevEntry = prevSnapshot.entries.find(e => e.investment === entry.investment)
        if (prevEntry && prevEntry.amount > 0) {
          assets[entry.investment] = displayMode === 'absolute'
            ? entry.amount - prevEntry.amount
            : ((entry.amount - prevEntry.amount) / prevEntry.amount) * 100
        } else {
          assets[entry.investment] = displayMode === 'absolute' ? entry.amount : 0
        }
      })

      return { date, total: monthlyReturn, assets }
    }
  })
}

const calculatePortfolioValues = (snapshots: PortfolioSnapshot[], timeView: TimeView): ChartDataPoint[] => {
  return snapshots.map((snapshot, index) => {
    const date = formatDate(snapshot.date)
    
    if (timeView === 'cumulative') {
      // Just show absolute values
      const assets: Record<string, number> = {}
      snapshot.entries.filter(e => e.amount > 0).forEach(entry => {
        assets[entry.investment] = entry.amount
      })

      return { 
        date, 
        total: snapshot.netWorth, 
        assets 
      }
    } else {
      // Monthly value changes (in dollars)
      const prevSnapshot = index > 0 ? snapshots[index - 1] : snapshot
      const monthlyChange = snapshot.netWorth - prevSnapshot.netWorth

      const assets: Record<string, number> = {}
      snapshot.entries.filter(e => e.amount > 0).forEach(entry => {
        const prevEntry = prevSnapshot.entries.find(e => e.investment === entry.investment)
        const prevAmount = prevEntry?.amount || 0
        assets[entry.investment] = entry.amount - prevAmount
      })

      return { 
        date, 
        total: monthlyChange, 
        assets 
      }
    }
  })
}

const calculateAllocation = (snapshots: PortfolioSnapshot[]): ChartDataPoint[] => {
  return snapshots.map((snapshot) => {
    const date = formatDate(snapshot.date)
    
    // Calculate total positive assets (exclude debt)
    const positiveEntries = snapshot.entries.filter(e => e.amount > 0)
    const totalPositiveValue = positiveEntries.reduce((sum, entry) => sum + entry.amount, 0)
    
    const assets: Record<string, number> = {}
    
    // Calculate percentage allocation for each asset
    positiveEntries.forEach(entry => {
      if (totalPositiveValue > 0) {
        assets[entry.investment] = (entry.amount / totalPositiveValue) * 100
      } else {
        assets[entry.investment] = 0
      }
    })

    // Total should always be 100% for allocation view
    return { 
      date, 
      total: 100, 
      assets 
    }
  })
}

export const getDataTypeLabel = (dataType: DataType): string => {
  switch (dataType) {
    case 'returns': return 'Performance Analysis'
    case 'portfolio': return 'Portfolio Value'
    case 'allocation': return 'Asset Allocation'
    default: return 'Analysis'
  }
}

export const getDataTypeUnit = (dataType: DataType, timeView: TimeView, displayMode: DisplayMode = 'percentage'): string => {
  switch (dataType) {
    case 'returns': 
      return displayMode === 'absolute' ? '$' : '%'
    case 'portfolio': 
      return timeView === 'cumulative' ? '$' : 'Δ$'
    case 'allocation': return '%'
    default: return ''
  }
}

export const formatChartValue = (value: number, dataType: DataType, timeView: TimeView, displayMode: DisplayMode = 'percentage'): string => {
  const unit = getDataTypeUnit(dataType, timeView, displayMode)
  
  if (unit.includes('$')) {
    // Format as currency
    const sign = value >= 0 ? '+' : ''
    return `${sign}${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(value))}`
  } else {
    // Format as percentage
    if (dataType === 'allocation') {
      // For allocation, don't show + sign, just the percentage
      return `${value.toFixed(1)}%`
    } else {
      // For returns, show + for positive values
      const sign = value >= 0 ? '+' : ''
      return `${sign}${value.toFixed(1)}%`
    }
  }
} 