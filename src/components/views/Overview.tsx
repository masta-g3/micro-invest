import { useState } from 'react'
import Card from '../layout/Card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useAppData } from '../../context/AppProvider'
import { formatCurrency, formatPercentage, calculateInsight } from '../../utils/calculations'
import { format } from 'date-fns'
import ImportDialog from '../ui/ImportDialog'
import Button from '../ui/Button'

export default function Overview() {
  const { snapshots, getLatestSnapshot, getAvailableDates, updateUI } = useAppData()
  const [showImportDialog, setShowImportDialog] = useState(false)

  const latestSnapshot = getLatestSnapshot()
  const availableDates = getAvailableDates().slice(0, 5) // Get 5 most recent dates
  
  // Calculate insight for the latest snapshot
  const insight = latestSnapshot ? (() => {
    const currentIndex = snapshots.findIndex(s => s.date === latestSnapshot.date)
    const previousSnapshot = currentIndex > 0 ? snapshots[currentIndex - 1] : undefined
    return calculateInsight(latestSnapshot, previousSnapshot)
  })() : null

  // Clean empty state for power users
  if (!latestSnapshot) {
    return (
      <>
        <Card className="text-center py-16">
          <h2 className="text-xl text-text-secondary mb-4">No investment data yet</h2>
          <div className="flex justify-center gap-4">
            <Button onClick={() => updateUI({ viewMode: 'add' })}>
              Add Entry
            </Button>
            <Button variant="secondary" onClick={() => setShowImportDialog(true)}>
              Import CSV
            </Button>
          </div>
        </Card>

        {/* Import Dialog for empty state */}
        <ImportDialog 
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
        />
      </>
    )
  }

  // Calculate allocation data
  const allocationData = Object.entries(insight?.allocation || {})
    .sort(([,a], [,b]) => b - a)
    .map(([name, percentage]) => {
      const entry = latestSnapshot.entries.find((e: any) => e.investment === name)
      return {
        name,
        value: entry?.amount || 0,
        percentage: Math.round(percentage * 10) / 10
      }
    })

  // Get top performers based on actual returns
  const topPerformers = insight ?
    [insight.topPerformer]
      .filter(performer => performer.growth > 0)
      .slice(0, 3) // Keep consistent with previous limit
    : []

  // Generate recent activity from available dates
  const recentActivity = availableDates.slice(0, 3).map(date => {
    try {
      const formattedDate = format(new Date(date), 'MMM d')
      return `${formattedDate}: Monthly snapshot updated`
    } catch {
      return `${date}: Monthly snapshot updated`
    }
  })

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-medium text-text-secondary tracking-wide">Net Worth</h1>
        <p className="text-5xl font-black text-accent tracking-tight leading-none">
          {formatCurrency(latestSnapshot.netWorth)}
        </p>
        <div className="flex items-center justify-center space-x-2 opacity-80 hover:opacity-100 transition-opacity">
          {insight && insight.monthlyChange !== 0 && (
            <>
              {insight.monthlyChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-accent" />
              ) : (
                <TrendingDown className="w-4 h-4 text-danger" />
              )}
              <span className={`text-sm font-medium ${insight.monthlyChange >= 0 ? 'text-accent' : 'text-danger'}`}>
                {formatPercentage(insight.monthlyChange)} this month
              </span>
            </>
          )}
          {(!insight || insight.monthlyChange === 0) && (
            <span className="text-sm text-text-muted">No change data available</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="transition-all duration-200 hover:shadow-md opacity-90 hover:opacity-100">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Top Performers</h3>
          <div className="space-y-3">
            {topPerformers.length > 0 ? topPerformers.map((performer: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-1 hover:bg-surface-hover/30 rounded px-2 -mx-2 transition-colors">
                <span className="text-text-secondary">{performer.name}</span>
                <span className="text-accent font-semibold">{formatPercentage(performer.growth)}</span>
              </div>
            )) : (
              <p className="text-text-muted">No positive performers this month</p>
            )}
          </div>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md opacity-90 hover:opacity-100">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Asset Allocation</h3>
          <div className="space-y-3">
            {allocationData.length > 0 ? allocationData.map((asset, index) => (
              <div key={index} className="space-y-1 hover:bg-surface-hover/30 rounded px-2 py-1 -mx-2 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">{asset.name}</span>
                  <span className="text-text-primary font-medium">{asset.percentage}%</span>
                </div>
                <div className="w-full bg-surface-hover rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(asset.percentage, 100)}%` }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-text-muted">No allocation data available</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="transition-all duration-200 hover:shadow-md opacity-90 hover:opacity-100">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-2 py-1 hover:bg-surface-hover/30 rounded px-2 -mx-2 transition-colors">
              <span className="w-2 h-2 bg-accent rounded-full"></span>
              <span className="text-text-secondary">{activity}</span>
            </div>
          )) : (
            <p className="text-text-muted">No recent activity</p>
          )}
        </div>
      </Card>
      
      {/* Import Dialog */}
      <ImportDialog 
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
      />
    </div>
  )
}