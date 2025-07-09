import { ViewMode } from '../../types'

interface NavigationProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function Navigation({ activeView, onViewChange }: NavigationProps) {
  const tabs = [
    { id: 'overview' as ViewMode, label: 'Overview', key: '1' },
    { id: 'snapshot' as ViewMode, label: 'Snapshot', key: '2' },
    { id: 'timeseries' as ViewMode, label: 'Time Series', key: '3' },
    { id: 'add' as ViewMode, label: '+ Add Entry', key: '4' }
  ]

  return (
    <nav className="flex flex-wrap space-x-4 md:space-x-8 border-b border-border mb-8 overflow-x-auto">
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
    </nav>
  )
}