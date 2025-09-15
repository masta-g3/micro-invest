import React, { createContext, useContext, useState, useCallback } from 'react'
import { AppData, AppStorage } from '../utils/storage'
import { InvestmentEntry, PortfolioSnapshot } from '../types'
import { calculateSnapshot } from '../utils/calculations'

interface AppContextType {
  data: AppData
  updateData: (updates: Partial<AppData>) => void
  updateUI: (updates: Partial<AppData['ui']>) => void
  addEntry: (entry: InvestmentEntry) => void
  updateEntry: (oldEntry: InvestmentEntry, newEntry: InvestmentEntry) => void
  deleteEntry: (date: string, investment: string) => void
  clearData: () => void
  snapshots: PortfolioSnapshot[]
  getAvailableDates: () => string[]
  getLatestSnapshot: () => PortfolioSnapshot | null
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useAppData = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppData must be used within an AppProvider')
  }
  return context
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(() => {
    AppStorage.migrateFromZustand()
    return AppStorage.load()
  })

  const snapshots = React.useMemo(() => {
    const uniqueDates = [...new Set(data.entries.map(e => e.date))].sort()
    return uniqueDates.map(date => calculateSnapshot(data.entries, date))
  }, [data.entries])

  const updateData = useCallback((updates: Partial<AppData>) => {
    setData(prev => {
      const next = { ...prev, ...updates }
      AppStorage.save(next)
      return next
    })
  }, [])

  const updateUI = useCallback((updates: Partial<AppData['ui']>) => {
    setData(prev => {
      const next = { ...prev, ui: { ...prev.ui, ...updates } }
      AppStorage.save(next)
      return next
    })
  }, [])

  const addEntry = useCallback((entry: InvestmentEntry) => {
    setData(prev => {
      const next = { ...prev, entries: [...prev.entries, entry] }
      AppStorage.save(next)
      return next
    })
  }, [])

  const updateEntry = useCallback((oldEntry: InvestmentEntry, newEntry: InvestmentEntry) => {
    setData(prev => {
      const next = { 
        ...prev, 
        entries: prev.entries.map(entry => 
          entry.date === oldEntry.date && entry.investment === oldEntry.investment 
            ? newEntry 
            : entry
        )
      }
      AppStorage.save(next)
      return next
    })
  }, [])

  const deleteEntry = useCallback((date: string, investment: string) => {
    setData(prev => {
      const next = { 
        ...prev, 
        entries: prev.entries.filter(e => !(e.date === date && e.investment === investment))
      }
      AppStorage.save(next)
      return next
    })
  }, [])

  const clearData = useCallback(() => {
    AppStorage.clear()
    setData(AppStorage.load())
  }, [])

  const getAvailableDates = useCallback(() => {
    return snapshots.map(s => s.date).sort().reverse()
  }, [snapshots])

  const getLatestSnapshot = useCallback(() => {
    return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null
  }, [snapshots])

  const contextValue: AppContextType = {
    data,
    updateData,
    updateUI,
    addEntry,
    updateEntry,
    deleteEntry,
    clearData,
    snapshots,
    getAvailableDates,
    getLatestSnapshot
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}