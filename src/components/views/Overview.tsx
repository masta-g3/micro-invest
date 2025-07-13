import Card from '../layout/Card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useAppData } from '../../context/AppProvider'
import { formatCurrency, formatPercentage, calculateInsight } from '../../utils/calculations'
import { format } from 'date-fns'

export default function Overview() {
  const { snapshots, getLatestSnapshot, getAvailableDates } = useAppData()

  const latestSnapshot = getLatestSnapshot()
  const availableDates = getAvailableDates().slice(0, 5) // Get 5 most recent dates
  
  // Calculate insight for the latest snapshot
  const insight = latestSnapshot ? (() => {
    const currentIndex = snapshots.findIndex(s => s.date === latestSnapshot.date)
    const previousSnapshot = currentIndex > 0 ? snapshots[currentIndex - 1] : undefined
    return calculateInsight(latestSnapshot, previousSnapshot)
  })() : null

  // Fallback to default values if no data
  if (!latestSnapshot) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">No investment data available</p>
      </div>
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

  // Get top performers (positive rates only)
  const topPerformers = latestSnapshot.entries
    .filter((entry: any) => entry.amount > 0 && entry.rate > 0)
    .sort((a: any, b: any) => b.rate - a.rate)
    .slice(0, 3)
    .map((entry: any) => ({
      name: entry.investment,
      growth: entry.rate
    }))

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
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">Net Worth</h1>
        <p className="text-4xl font-bold text-accent">
          {formatCurrency(latestSnapshot.netWorth)}
        </p>
        <div className="flex items-center justify-center space-x-2">
          {insight && insight.monthlyChange !== 0 && (
            <>
              {insight.monthlyChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-accent" />
              ) : (
                <TrendingDown className="w-4 h-4 text-danger" />
              )}
              <span className={insight.monthlyChange >= 0 ? 'text-accent' : 'text-danger'}>
                {formatPercentage(insight.monthlyChange)} this month
              </span>
            </>
          )}
          {(!insight || insight.monthlyChange === 0) && (
            <span className="text-text-muted">No change data available</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Top Performers</h3>
          <div className="space-y-3">
            {topPerformers.length > 0 ? topPerformers.map((performer: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-text-secondary">{performer.name}</span>
                <span className="text-accent font-semibold">{formatPercentage(performer.growth)}</span>
              </div>
            )) : (
              <p className="text-text-muted">No positive performers this month</p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Asset Allocation</h3>
          <div className="space-y-3">
            {allocationData.length > 0 ? allocationData.map((asset, index) => (
              <div key={index} className="space-y-1">
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

      <Card>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-accent rounded-full"></span>
              <span className="text-text-secondary">{activity}</span>
            </div>
          )) : (
            <p className="text-text-muted">No recent activity</p>
          )}
        </div>
      </Card>
    </div>
  )
}