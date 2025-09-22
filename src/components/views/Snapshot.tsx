import React, { useState } from 'react'
import Card from '../layout/Card'
import { ChevronLeft, ChevronRight, Lightbulb, Edit3, Check, X, Trash2 } from 'lucide-react'
import { useAppData } from '../../context/AppProvider'
import { formatCurrency, formatPercentage, calculateInsight, calculateActualReturn, annualizedToMonthly, calculateGrowthFromPrevious, formatGrowth } from '../../utils/calculations'
import { format } from 'date-fns'
import { InvestmentEntry } from '../../types'
import { useToast } from '../../hooks/useToast'
import Button from '../ui/Button'

export default function Snapshot() {
  const { data, updateUI, snapshots, getAvailableDates, updateEntry, deleteEntry, addEntry } = useAppData()
  const { toast } = useToast()
  const selectedDate = data.ui.selectedDate
  const [editingEntry, setEditingEntry] = useState<InvestmentEntry | null>(null)
  const [editValues, setEditValues] = useState({ amount: '', rate: '' })
  const [confirmDelete, setConfirmDelete] = useState<InvestmentEntry | null>(null)

  const availableDates = getAvailableDates()

  // Fix: If selectedDate doesn't exist in available dates, use the first available date
  const validSelectedDate = selectedDate && availableDates.includes(selectedDate) ? selectedDate : null
  const currentDate = validSelectedDate || (availableDates.length > 0 ? availableDates[0] : null)
  const snapshot = currentDate ? snapshots.find(s => s.date === currentDate) : null

  // If we found a mismatch and corrected it, update the UI
  React.useEffect(() => {
    if (selectedDate && !availableDates.includes(selectedDate) && availableDates.length > 0) {
      updateUI({ selectedDate: availableDates[0] })
    }
  }, [selectedDate, availableDates, updateUI])
  
  // Calculate insight for current snapshot
  const insight = snapshot ? (() => {
    const currentIndex = snapshots.findIndex(s => s.date === snapshot.date)
    const previousSnapshot = currentIndex > 0 ? snapshots[currentIndex - 1] : undefined
    return calculateInsight(snapshot, previousSnapshot)
  })() : null

  // Find previous and next dates
  const currentIndex = availableDates.indexOf(currentDate || '')
  const previousDate = currentIndex < availableDates.length - 1 ? availableDates[currentIndex + 1] : null
  const nextDate = currentIndex > 0 ? availableDates[currentIndex - 1] : null

  // Calculate changes and actual returns from previous month
  const previousSnapshot = previousDate ? snapshots.find(s => s.date === previousDate) : null
  const entriesWithChanges = snapshot?.entries.map(entry => {
    const previousEntry = previousSnapshot?.entries.find(e => e.investment === entry.investment)
    const change = previousEntry ? entry.amount - previousEntry.amount : 0
    const actualReturn = calculateActualReturn(entry.amount, previousEntry?.amount)
    return { ...entry, change, actualReturn }
  }) || []

  // Total period change for summary (absolute and percentage)
  const periodChangeAbs = previousSnapshot ? snapshot.netWorth - previousSnapshot.netWorth : 0
  const periodChangePct = previousSnapshot ? calculateGrowthFromPrevious(snapshot, previousSnapshot) : 0

  const startEdit = (entry: InvestmentEntry) => {
    setEditingEntry(entry)
    setEditValues({ 
      amount: Math.abs(entry.amount).toString(), 
      rate: entry.rate.toString() 
    })
  }

  const cancelEdit = () => {
    setEditingEntry(null)
    setEditValues({ amount: '', rate: '' })
  }

  const handleDelete = (entry: InvestmentEntry) => {
    const backup = { ...entry }
    deleteEntry(entry.date, entry.investment)
    setConfirmDelete(null)

    toast(
      `Deleted ${entry.investment}`,
      'success',
      {
        label: 'Undo',
        handler: () => addEntry(backup)
      }
    )
  }

  const cancelDelete = () => {
    setConfirmDelete(null)
  }

  const saveEdit = () => {
    if (!editingEntry) return
    
    const newAmount = parseFloat(editValues.amount) * (editingEntry.amount < 0 ? -1 : 1)
    const newRate = parseFloat(editValues.rate)
    
    if (isNaN(newAmount) || isNaN(newRate)) return
    
    const newEntry: InvestmentEntry = {
      ...editingEntry,
      amount: newAmount,
      rate: newRate
    }
    
    updateEntry(editingEntry, newEntry)
    setEditingEntry(null)
    setEditValues({ amount: '', rate: '' })
  }

  if (!snapshot) {
    return (
      <Card className="text-center py-16">
        <p className="text-text-secondary mb-4">No data available. Add entries to see analysis.</p>
      </Card>
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
          onClick={() => previousDate && updateUI({ selectedDate: previousDate })}
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
          onClick={() => nextDate && updateUI({ selectedDate: nextDate })}
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
                <th className="text-center py-3 text-text-secondary font-medium w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entriesWithChanges.map((entry, index) => {
                const isEditing = editingEntry?.date === entry.date && editingEntry?.investment === entry.investment
                const isDeleting = confirmDelete?.date === entry.date && confirmDelete?.investment === entry.investment

                return (
                  <tr key={index} className={`border-b border-border last:border-b-0 transition-all duration-200 ${
                    isDeleting ? 'bg-danger/5 scale-[0.98]' :
                    isEditing ? 'bg-surface-hover/50 shadow-sm' :
                    'opacity-85 hover:opacity-100 hover:bg-surface-hover/30'
                  }`}>
                    <td className="py-3 text-text-primary font-medium">{entry.investment}</td>
                    
                    {/* Amount Column */}
                    <td className={`py-3 text-right font-medium ${
                      entry.amount < 0 ? 'text-danger' : 'text-text-primary'
                    }`}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.amount}
                          onChange={(e) => setEditValues({ ...editValues, amount: e.target.value })}
                          className="w-24 px-2 py-1 text-right bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                          placeholder="Amount"
                        />
                      ) : (
                        formatCurrency(Math.abs(entry.amount))
                      )}
                    </td>
                    
                    {/* Rate Column */}
                    <td className="py-3 text-right hidden sm:table-cell">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.rate}
                          onChange={(e) => setEditValues({ ...editValues, rate: e.target.value })}
                          className="w-16 px-2 py-1 text-right bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                          placeholder="Rate"
                        />
                      ) : (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <div className={`text-sm font-medium ${
                              entry.actualReturn !== null ?
                                entry.actualReturn > 0 ? 'text-accent' :
                                entry.actualReturn < 0 ? 'text-danger' : 'text-text-secondary'
                              : 'text-text-muted'
                            }`}>
                              {entry.actualReturn !== null ? formatPercentage(entry.actualReturn, 1) : '—'}
                            </div>
                          </div>
                          <div className="pt-2 border-t border-border/30">
                            <div className="text-xs text-text-muted">
                              Expected: {formatPercentage(annualizedToMonthly(entry.rate), 1).replace('+', '')}
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    
                    {/* Change Column */}
                    <td className={`py-3 text-right font-medium ${
                      entry.change > 0 ? 'text-accent' : entry.change < 0 ? 'text-danger' : 'text-text-secondary'
                    }`}>
                      {entry.change !== 0 ? formatCurrency(entry.change) : '—'}
                    </td>
                    
                    {/* Actions Column */}
                    <td className="py-3 text-center">
                      {confirmDelete?.date === entry.date && confirmDelete?.investment === entry.investment ? (
                        <div className="flex items-center justify-center space-x-1">
                          <Button size="sm" onClick={() => handleDelete(entry)}>
                            Delete
                          </Button>
                          <Button variant="ghost" size="sm" onClick={cancelDelete}>
                            Cancel
                          </Button>
                        </div>
                      ) : isEditing ? (
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={saveEdit}
                            className="p-1 text-accent hover:bg-accent/10 rounded transition-colors"
                            title="Save changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(entry)}
                            className="p-1 text-danger hover:bg-danger/10 rounded transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-text-secondary hover:bg-surface-hover rounded transition-colors"
                            title="Cancel editing"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(entry)}
                          className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
                          title="Edit entry"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
          <span className="text-text-secondary">
            Total Assets: {formatCurrency(snapshot.totalValue)}
          </span>
          <div className="text-right">
            <div className="text-text-primary font-semibold">
              Net Worth: {formatCurrency(snapshot.netWorth)}
            </div>
            <div
              className={`text-sm font-medium ${
                periodChangeAbs > 0
                  ? 'text-accent'
                  : periodChangeAbs < 0
                  ? 'text-danger'
                  : 'text-text-secondary'
              }`}
            >
              {periodChangeAbs !== 0
                ? `${formatGrowth(periodChangeAbs)} (${formatPercentage(periodChangePct, 1)})`
                : '—'}
            </div>
          </div>
        </div>
      </Card>

      {insight && (insight.topPerformer.growth > 0 || insight.underperformer.growth < 0) && (
        <Card>
          <div className="flex items-center space-x-2 text-warning">
            <Lightbulb className="w-4 h-4" />
            <span className="text-sm">
              {insight.topPerformer.growth > 0 && (
                <span>
                  {insight.topPerformer.name} delivered {formatPercentage(insight.topPerformer.growth)} actual return
                </span>
              )}
              {insight.topPerformer.growth > 0 && insight.underperformer.growth < 0 && (
                <span> • </span>
              )}
              {insight.underperformer.growth < 0 && (
                <span>
                  {insight.underperformer.name} declined {formatPercentage(Math.abs(insight.underperformer.growth))}
                </span>
              )}
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}