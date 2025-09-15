import { useEffect } from 'react'
import Card from '../layout/Card'
import { Plus, X } from 'lucide-react'
import { useAppData } from '../../context/AppProvider'
import { INVESTMENT_OPTIONS } from '../../constants'
import Button from '../ui/Button'

export default function AddEntry() {
  const { data, updateUI, addEntry: saveEntry, getLatestSnapshot } = useAppData()
  const { date, entries } = data.ui.formData

  const addEntry = () => {
    updateUI({
      formData: {
        ...data.ui.formData,
        entries: [...entries, { investment: '', amount: '', rate: '' }]
      }
    })
  }

  const removeEntry = (index: number) => {
    updateUI({
      formData: {
        ...data.ui.formData,
        entries: entries.filter((_, i) => i !== index)
      }
    })
  }

  const updateEntry = (index: number, field: string, value: string) => {
    const updated = entries.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    )
    updateUI({
      formData: {
        ...data.ui.formData,
        entries: updated
      }
    })
  }

  const prefillFromPrevious = () => {
    const latestSnapshot = getLatestSnapshot()
    if (!latestSnapshot) return

    const previousData = latestSnapshot.entries.map(entry => ({
      investment: entry.investment,
      amount: entry.amount.toString(),
      rate: entry.rate.toString()
    }))

    updateUI({
      formData: {
        ...data.ui.formData,
        entries: previousData
      }
    })
  }

  const handleCancel = () => {
    // Reset form to initial state
    updateUI({
      formData: {
        date: new Date().toISOString().split('T')[0],
        entries: [{ investment: '', amount: '', rate: '' }]
      },
      // Navigate back to Overview
      viewMode: 'overview'
    })
  }

  // Add keyboard shortcut for adding new investment rows
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only work if we're in the Add Entry tab
      if (data.ui.viewMode !== 'add') return
      
      // Ignore shortcuts when modifier keys are pressed
      if (event.ctrlKey || event.metaKey || event.altKey) return
      
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
      
      // Add new investment row with "+" key
      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        addEntry()
      }
      
      // Cancel with Escape key
      if (event.key === 'Escape') {
        event.preventDefault()
        handleCancel()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [data.ui.viewMode, addEntry, handleCancel])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-text-primary mb-2">Add New Entry</h2>
        <p className="text-text-secondary">Record your investment snapshot for a specific date</p>
      </div>

      <Card>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => updateUI({
                formData: {
                  ...data.ui.formData,
                  date: e.target.value
                }
              })}
              className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-4">Investments</label>
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-surface-hover rounded-lg">
                  <select
                    value={entry.investment}
                    onChange={(e) => updateEntry(index, 'investment', e.target.value)}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent appearance-none cursor-pointer"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a3a3a3' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="" className="bg-background text-text-primary">Select investment...</option>
                    {INVESTMENT_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-background text-text-primary">{option}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-text-secondary">$</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={entry.amount}
                      onChange={(e) => updateEntry(index, 'amount', e.target.value)}
                      className="w-32 px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="Rate"
                      value={entry.rate}
                      onChange={(e) => updateEntry(index, 'rate', e.target.value)}
                      className="w-20 px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                    <span className="text-text-secondary">%</span>
                  </div>
                  
                  {entries.length > 1 && (
                    <button
                      onClick={() => removeEntry(index)}
                      className="p-1 text-danger hover:bg-danger/10 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                onClick={addEntry}
                className="flex items-center space-x-2 px-3 py-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Investment</span>
                <span className="text-xs text-text-muted ml-2">+</span>
              </button>
            </div>
          </div>

          {getLatestSnapshot() && (
            <div className="pt-4 border-t border-border">
              <Button variant="ghost" onClick={prefillFromPrevious}>
                Load values from {new Date(getLatestSnapshot()!.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Button>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                entries.forEach(entry => {
                  if (entry.investment && entry.amount && entry.rate) {
                    saveEntry({
                      date,
                      investment: entry.investment,
                      amount: parseFloat(entry.amount),
                      rate: parseFloat(entry.rate)
                    })
                  }
                })
                updateUI({
                  formData: {
                    date: new Date().toISOString().split('T')[0],
                    entries: [{ investment: 'Wealthfront', amount: '', rate: '' }]
                  }
                })
              }}
            >
              Save Entry
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}