import { useEffect, useState } from 'react'
import { useAppData } from './context/AppProvider'
import { loadCSVFromFile } from './utils/csv'
import Container from './components/layout/Container'
import Navigation from './components/layout/Navigation'
import Overview from './components/views/Overview'
import Snapshot from './components/views/Snapshot'
import TimeSeries from './components/views/TimeSeries'
import AddEntry from './components/views/AddEntry'

function App() {
  const { data, updateUI, updateData } = useAppData()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isInitialized = data.entries.length > 0
  const { viewMode } = data.ui

  useEffect(() => {
    const initializeData = async () => {
      if (data.entries.length > 0) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const result = await loadCSVFromFile('/investments.csv')
        
        if (result.errors.length > 0) {
          console.warn('CSV parsing warnings:', result.errors)
          setError(`Data loaded with warnings: ${result.errors.slice(0, 3).join(', ')}${result.errors.length > 3 ? '...' : ''}`)
        }
        
        if (result.data.length > 0) {
          updateData({ entries: result.data })
          console.log(`Loaded ${result.data.length} investment entries from CSV`)
        } else {
          setError('No data found in CSV file')
        }
      } catch (error) {
        console.error('Failed to load investment data:', error)
        setError('Failed to load investment data. Please check the CSV file.')
      } finally {
        setIsLoading(false)
      }
    }
    
    initializeData()
  }, [data.entries.length, updateData])
  
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore shortcuts when modifier keys are pressed
      if (event.ctrlKey || event.metaKey) return
      
      // Ignore shortcuts when user is typing in input fields
      const target = event.target as HTMLElement
      const isInputFocused = target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.contentEditable === 'true' ||
        target.closest('input, textarea, select, [contenteditable]')
      )
      
      if (isInputFocused) return
      
      switch (event.key) {
        case '1':
          updateUI({ viewMode: 'overview' })
          break
        case '2':
          updateUI({ viewMode: 'snapshot' })
          break
        case '3':
          updateUI({ viewMode: 'timeseries' })
          break
        case '4':
          updateUI({ viewMode: 'add' })
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [updateUI])

  const renderView = () => {
    switch (viewMode) {
      case 'overview':
        return <Overview />
      case 'snapshot':
        return <Snapshot />
      case 'timeseries':
        return <TimeSeries />
      case 'add':
        return <AddEntry />
      default:
        return <Overview />
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading investment data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Container className="py-4 sm:py-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-danger text-xl">⚠</span>
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Failed to Load Data</h2>
            <p className="text-text-secondary mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/80 transition-colors"
            >
              Retry
            </button>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Container className="py-4 sm:py-8">
        {error && (
          <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-warning text-sm">{error}</p>
          </div>
        )}
        <Navigation 
          activeView={viewMode} 
          onViewChange={(mode) => updateUI({ viewMode: mode })}
        />
        <main className="transition-all duration-300 ease-in-out">
          {renderView()}
        </main>
      </Container>
    </div>
  )
}

export default App