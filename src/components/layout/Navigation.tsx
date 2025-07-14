import { ViewMode } from '../../types'
import { useAppData } from '../../context/AppProvider'
import DataControls from '../ui/DataControls'

interface NavigationProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function Navigation({ activeView, onViewChange }: NavigationProps) {
  const { data, updateUI } = useAppData()
  const { theme } = data.ui
  
  const tabs = [
    { id: 'overview' as ViewMode, label: 'Overview', key: '1' },
    { id: 'snapshot' as ViewMode, label: 'Snapshot', key: '2' },
    { id: 'timeseries' as ViewMode, label: 'Time Series', key: '3' },
    { id: 'add' as ViewMode, label: '+ Add Entry', key: '4' }
  ]

  return (
    <nav className="flex justify-between items-center border-b border-border mb-8">
      <div className="flex flex-wrap space-x-4 md:space-x-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`
              pb-4 px-2 md:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
              ${activeView === tab.id 
                ? 'border-accent text-accent' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
              }
            `}
          >
            {tab.label}
            <span className="ml-2 text-xs text-text-muted hidden sm:inline">{tab.key}</span>
          </button>
        ))}
      </div>
      
      <div className="flex items-center space-x-3">
        <button
          onClick={() => updateUI({ theme: theme === 'dark' ? 'light' : 'dark' })}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode (t)`}
        >
          {theme === 'dark' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <DataControls />
      </div>
    </nav>
  )
}