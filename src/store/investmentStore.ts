import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { InvestmentEntry, PortfolioSnapshot, PortfolioInsight, ViewMode } from '../types'

interface InvestmentStore {
  // Data
  entries: InvestmentEntry[]
  snapshots: PortfolioSnapshot[]
  
  // UI State
  selectedDate: string | null
  viewMode: ViewMode
  isLoading: boolean
  error: string | null
  
  // Data Actions
  setEntries: (entries: InvestmentEntry[]) => void
  addEntry: (entry: InvestmentEntry) => void
  deleteEntry: (date: string, investment: string) => void
  
  // UI Actions
  setSelectedDate: (date: string | null) => void
  setViewMode: (mode: ViewMode) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Computed Data
  getSnapshotForDate: (date: string) => PortfolioSnapshot | null
  getAvailableDates: () => string[]
  getLatestSnapshot: () => PortfolioSnapshot | null
  getInsightForDate: (date: string) => PortfolioInsight | null
  getAssetTypes: () => string[]
  getPortfolioEvolution: () => { date: string; netWorth: number; totalValue: number }[]
  
  // Utility Actions
  clearData: () => void
  loadFromCSV: (csvData: string) => void
  exportToCSV: () => string
}

const calculateSnapshot = (entries: InvestmentEntry[], date: string): PortfolioSnapshot => {
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

const calculateInsight = (snapshot: PortfolioSnapshot, previousSnapshot?: PortfolioSnapshot): PortfolioInsight => {
  const positiveEntries = snapshot.entries.filter(entry => entry.amount > 0)
  
  // Find top and underperformer by rate
  let topPerformer = { name: '', growth: -Infinity }
  let underperformer = { name: '', growth: Infinity }
  
  positiveEntries.forEach(entry => {
    if (entry.rate > topPerformer.growth) {
      topPerformer = { name: entry.investment, growth: entry.rate }
    }
    if (entry.rate < underperformer.growth) {
      underperformer = { name: entry.investment, growth: entry.rate }
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

export const useInvestmentStore = create<InvestmentStore>()(
  persist(
    (set, get) => ({
      // Initial state
      entries: [],
      snapshots: [],
      selectedDate: null,
      viewMode: 'overview',
      isLoading: false,
      error: null,
      
      // Data actions
      setEntries: (entries) => {
        const uniqueDates = [...new Set(entries.map(e => e.date))].sort()
        const snapshots = uniqueDates.map(date => calculateSnapshot(entries, date))
        
        set({ entries, snapshots, error: null })
      },
      
      addEntry: (entry) => {
        const { entries } = get()
        const newEntries = [...entries, entry]
        get().setEntries(newEntries)
      },
      
      deleteEntry: (date, investment) => {
        const { entries } = get()
        const newEntries = entries.filter(e => !(e.date === date && e.investment === investment))
        get().setEntries(newEntries)
      },
      
      // UI actions
      setSelectedDate: (date) => set({ selectedDate: date }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      // Computed data
      getSnapshotForDate: (date) => {
        const { snapshots } = get()
        return snapshots.find(s => s.date === date) || null
      },
      
      getAvailableDates: () => {
        const { snapshots } = get()
        return snapshots.map(s => s.date).sort().reverse() // Most recent first
      },
      
      getLatestSnapshot: () => {
        const { snapshots } = get()
        return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null
      },
      
      getInsightForDate: (date) => {
        const { snapshots } = get()
        const currentSnapshot = snapshots.find(s => s.date === date)
        if (!currentSnapshot) return null
        
        const currentIndex = snapshots.findIndex(s => s.date === date)
        const previousSnapshot = currentIndex > 0 ? snapshots[currentIndex - 1] : undefined
        
        return calculateInsight(currentSnapshot, previousSnapshot)
      },
      
      getAssetTypes: () => {
        const { entries } = get()
        return [...new Set(entries.map(e => e.investment))].sort()
      },
      
      getPortfolioEvolution: () => {
        const { snapshots } = get()
        return snapshots.map(snapshot => ({
          date: snapshot.date,
          netWorth: snapshot.netWorth,
          totalValue: snapshot.totalValue
        }))
      },
      
      // Utility actions
      clearData: () => set({ 
        entries: [], 
        snapshots: [], 
        selectedDate: null, 
        error: null 
      }),
      
      loadFromCSV: (csvData) => {
        try {
          const lines = csvData.trim().split('\n')
          const headers = lines[0].split(',')
          
          if (headers.length !== 4 || headers[0] !== 'Date' || headers[1] !== 'Investment' || headers[2] !== 'Amount' || headers[3] !== 'Rate') {
            throw new Error('Invalid CSV format. Expected: Date,Investment,Amount,Rate')
          }
          
          const entries: InvestmentEntry[] = lines.slice(1).map((line, index) => {
            const [date, investment, amountStr, rateStr] = line.split(',')
            
            if (!date || !investment || !amountStr || !rateStr) {
              throw new Error(`Invalid data on line ${index + 2}`)
            }
            
            const amount = parseFloat(amountStr)
            const rate = parseFloat(rateStr)
            
            if (isNaN(amount) || isNaN(rate)) {
              throw new Error(`Invalid numbers on line ${index + 2}`)
            }
            
            return { date, investment, amount, rate }
          })
          
          get().setEntries(entries)
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to parse CSV' })
        }
      },
      
      exportToCSV: () => {
        const { entries } = get()
        const header = 'Date,Investment,Amount,Rate'
        const rows = entries.map(entry => 
          `${entry.date},${entry.investment},${entry.amount},${entry.rate}`
        )
        return [header, ...rows].join('\n')
      }
    }),
    {
      name: 'investment-storage',
      partialize: (state) => ({
        entries: state.entries,
        selectedDate: state.selectedDate,
        viewMode: state.viewMode
      })
    }
  )
) 