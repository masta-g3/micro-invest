import { InvestmentEntry, ViewMode, ChartSettings, FormData } from '../types'

export interface AppData {
  entries: InvestmentEntry[]
  ui: {
    selectedDate: string | null
    viewMode: ViewMode
    theme: 'dark' | 'light'
    chartSettings: ChartSettings
    formData: FormData
  }
}

const STORAGE_KEY = 'micro-invest-data'

const defaultData: AppData = {
  entries: [],
  ui: {
    selectedDate: null,
    viewMode: 'overview',
    theme: 'dark',
    chartSettings: {
      mainView: 'performance',
      performanceView: 'cumulative',
      ownershipView: 'allocation',
      showByAsset: false,
      displayMode: 'percentage',
      visibleAssets: []
    },
    formData: {
      date: new Date().toISOString().split('T')[0],
      entries: [
        { investment: 'Wealthfront', amount: '', rate: '' },
        { investment: 'Vanguard', amount: '', rate: '' }
      ]
    }
  }
}

export const AppStorage = {
  load: (): AppData => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return defaultData
      
      const parsed = JSON.parse(stored)
      return { ...defaultData, ...parsed }
    } catch (error) {
      console.warn('Failed to load app data from storage:', error)
      return defaultData
    }
  },

  save: (data: Partial<AppData>): void => {
    try {
      const current = AppStorage.load()
      const merged = { ...current, ...data }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    } catch (error) {
      console.warn('Failed to save app data to storage:', error)
    }
  },

  update: (updater: (current: AppData) => AppData): void => {
    try {
      const current = AppStorage.load()
      const updated = updater(current)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.warn('Failed to update app data in storage:', error)
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear app data from storage:', error)
    }
  },

  migrateFromZustand: (): void => {
    try {
      const oldData = localStorage.getItem('investment-storage')
      if (!oldData) return

      const parsed = JSON.parse(oldData)
      const state = parsed.state || {}
      
      const migrated: AppData = {
        entries: state.entries || [],
        ui: {
          selectedDate: state.selectedDate || null,
          viewMode: state.viewMode || 'overview',
          theme: 'dark',
          chartSettings: defaultData.ui.chartSettings,
          formData: defaultData.ui.formData
        }
      }

      AppStorage.save(migrated)
      localStorage.removeItem('investment-storage')
      
      console.log('Successfully migrated data from Zustand storage')
    } catch (error) {
      console.warn('Failed to migrate from Zustand storage:', error)
    }
  }
}