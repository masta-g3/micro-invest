import { useEffect } from 'react'
import { useInvestmentStore } from '../store/investmentStore'
import { loadCSVFromFile } from '../utils/csv'

export const useInitializeData = () => {
  const { 
    entries, 
    setLoading, 
    setError, 
    setEntries,
    setSelectedDate,
    getLatestSnapshot,
    getAvailableDates
  } = useInvestmentStore()

  useEffect(() => {
    const initializeData = async () => {
      // Skip if data is already loaded
      if (entries.length > 0) {
        // Set selected date to latest if not already set
        const latestSnapshot = getLatestSnapshot()
        if (latestSnapshot) {
          setSelectedDate(latestSnapshot.date)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Try to load from the CSV file in the public directory
        const result = await loadCSVFromFile('/investments.csv')
        
        if (result.errors.length > 0) {
          console.warn('CSV parsing warnings:', result.errors)
          setError(`Data loaded with warnings: ${result.errors.slice(0, 3).join(', ')}${result.errors.length > 3 ? '...' : ''}`)
        }

        if (result.data.length > 0) {
          setEntries(result.data)
          
          // Set the latest date as selected
          const dates = getAvailableDates()
          if (dates.length > 0) {
            setSelectedDate(dates[0]) // getAvailableDates returns most recent first
          }
          
          console.log(`Loaded ${result.data.length} investment entries from CSV`)
        } else {
          setError('No data found in CSV file')
        }
      } catch (error) {
        console.error('Failed to load investment data:', error)
        setError('Failed to load investment data. Please check the CSV file.')
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [entries.length, setLoading, setError, setEntries, setSelectedDate, getLatestSnapshot, getAvailableDates])

  return {
    isInitialized: entries.length > 0,
    isLoading: useInvestmentStore(state => state.isLoading),
    error: useInvestmentStore(state => state.error)
  }
} 