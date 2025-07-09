import Card from '../layout/Card'
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'
import { useInvestmentStore } from '../../store/investmentStore'
import { formatCurrency, formatPercentage } from '../../utils/calculations'
import { format } from 'date-fns'

export default function Snapshot() {
  const { 
    selectedDate,
    setSelectedDate,
    getSnapshotForDate,
    getInsightForDate,
    getAvailableDates,
    snapshots
  } = useInvestmentStore()

  const availableDates = getAvailableDates()
  const currentDate = selectedDate || (availableDates.length > 0 ? availableDates[0] : null)
  const snapshot = currentDate ? getSnapshotForDate(currentDate) : null
  const insight = currentDate ? getInsightForDate(currentDate) : null

  // Find previous and next dates
  const currentIndex = availableDates.indexOf(currentDate || '')
  const previousDate = currentIndex < availableDates.length - 1 ? availableDates[currentIndex + 1] : null
  const nextDate = currentIndex > 0 ? availableDates[currentIndex - 1] : null

  // Calculate changes from previous month
  const previousSnapshot = previousDate ? getSnapshotForDate(previousDate) : null
  const entriesWithChanges = snapshot?.entries.map(entry => {
    const previousEntry = previousSnapshot?.entries.find(e => e.investment === entry.investment)
    const change = previousEntry ? entry.amount - previousEntry.amount : 0
    return { ...entry, change }
  }) || []

  if (!snapshot) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">No snapshot data available</p>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMMM d, yyyy')
    } catch {
      return dateStr
    }
  }

  const formatMonthYear = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM yyyy')
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => previousDate && setSelectedDate(previousDate)}
          disabled={!previousDate}
          className={`flex items-center space-x-2 transition-colors ${
            previousDate 
              ? 'text-text-secondary hover:text-text-primary' 
              : 'text-text-muted cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{previousDate ? formatMonthYear(previousDate) : '—'}</span>
        </button>
        <h2 className="text-xl font-semibold text-text-primary">
          {formatDate(currentDate || '')}
        </h2>
        <button 
          onClick={() => nextDate && setSelectedDate(nextDate)}
          disabled={!nextDate}
          className={`flex items-center space-x-2 transition-colors ${
            nextDate 
              ? 'text-text-secondary hover:text-text-primary' 
              : 'text-text-muted cursor-not-allowed'
          }`}
        >
          <span>{nextDate ? formatMonthYear(nextDate) : '—'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 text-text-secondary font-medium">Investment</th>
                <th className="text-right py-3 text-text-secondary font-medium">Amount</th>
                <th className="text-right py-3 text-text-secondary font-medium hidden sm:table-cell">Rate</th>
                <th className="text-right py-3 text-text-secondary font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {entriesWithChanges.map((entry, index) => (
                <tr key={index} className="border-b border-border last:border-b-0">
                  <td className="py-3 text-text-primary font-medium">{entry.investment}</td>
                  <td className={`py-3 text-right font-medium ${
                    entry.amount < 0 ? 'text-danger' : 'text-text-primary'
                  }`}>
                    {formatCurrency(Math.abs(entry.amount))}
                  </td>
                  <td className="py-3 text-right text-text-secondary hidden sm:table-cell">
                    {formatPercentage(entry.rate, 1).replace('+', '')}
                  </td>
                  <td className={`py-3 text-right font-medium ${
                    entry.change > 0 ? 'text-accent' : entry.change < 0 ? 'text-danger' : 'text-text-secondary'
                  }`}>
                    {entry.change !== 0 ? formatCurrency(entry.change) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
          <span className="text-text-secondary">
            Total Assets: {formatCurrency(snapshot.totalValue)}
          </span>
          <span className="text-text-primary font-semibold">
            Net Worth: {formatCurrency(snapshot.netWorth)}
          </span>
        </div>
      </Card>

      {insight && (insight.topPerformer.growth > 0 || insight.underperformer.growth < 0) && (
        <Card>
          <div className="flex items-center space-x-2 text-warning">
            <Lightbulb className="w-4 h-4" />
            <span className="text-sm">
              {insight.topPerformer.growth > 0 && (
                <span>
                  {insight.topPerformer.name} showing strong {formatPercentage(insight.topPerformer.growth)} growth
                </span>
              )}
              {insight.topPerformer.growth > 0 && insight.underperformer.growth < 0 && (
                <span> • </span>
              )}
              {insight.underperformer.growth < 0 && (
                <span>
                  {insight.underperformer.name} down {formatPercentage(Math.abs(insight.underperformer.growth))}
                </span>
              )}
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}