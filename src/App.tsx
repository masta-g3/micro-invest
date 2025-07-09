import { useEffect } from 'react'
import { useInvestmentStore } from './store/investmentStore'
import { useInitializeData } from './hooks/useInitializeData'
import Container from './components/layout/Container'
import Navigation from './components/layout/Navigation'
import Overview from './components/views/Overview'
import Snapshot from './components/views/Snapshot'
import TimeSeries from './components/views/TimeSeries'
import AddEntry from './components/views/AddEntry'

function App() {
  const { viewMode, setViewMode } = useInvestmentStore()
  const { isInitialized, isLoading, error } = useInitializeData()

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) return
      
      switch (event.key) {
        case '1':
          setViewMode('overview')
          break
        case '2':
          setViewMode('snapshot')
          break
        case '3':
          setViewMode('timeseries')
          break
        case '4':
          setViewMode('add')
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [setViewMode])

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
          onViewChange={setViewMode}
        />
        <main className="transition-all duration-300 ease-in-out">
          {renderView()}
        </main>
      </Container>
    </div>
  )
}

export default App