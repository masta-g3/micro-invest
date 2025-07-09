import { useState } from 'react'
import Card from '../layout/Card'
import { Plus, X } from 'lucide-react'

export default function AddEntry() {
  const [date, setDate] = useState('2025-07-01')
  const [entries, setEntries] = useState([
    { investment: 'Wealthfront', amount: '', rate: '' },
    { investment: 'IRA', amount: '', rate: '' },
    { investment: 'Robinhood', amount: '', rate: '' },
    { investment: 'CETES', amount: '', rate: '' }
  ])

  const investmentOptions = [
    'Wealthfront', 'IRA', 'Robinhood', 'CETES', 'Crypto', 'Real Estate', 'Roth IRA', 'Debt'
  ]

  const addEntry = () => {
    setEntries([...entries, { investment: '', amount: '', rate: '' }])
  }

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, field: string, value: string) => {
    const updated = entries.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    )
    setEntries(updated)
  }

  const prefillFromPrevious = () => {
    const mockPreviousData = [
      { investment: 'Real Estate', amount: '231504', rate: '5' },
      { investment: 'IRA', amount: '221104', rate: '5' },
      { investment: 'Wealthfront', amount: '113521', rate: '4' },
      { investment: 'Robinhood', amount: '64650', rate: '7' },
      { investment: 'CETES', amount: '55142', rate: '8' },
      { investment: 'Crypto', amount: '7642', rate: '5' },
      { investment: 'Roth IRA', amount: '7000', rate: '7' },
      { investment: 'Debt', amount: '-124145', rate: '0' }
    ]
    setEntries(mockPreviousData)
  }

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
              onChange={(e) => setDate(e.target.value)}
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
                    {investmentOptions.map((option) => (
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
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <button
              onClick={prefillFromPrevious}
              className="px-4 py-2 bg-surface-hover hover:bg-border text-text-primary rounded-lg transition-colors"
            >
              Load June 2025 values
            </button>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <button className="px-6 py-2 text-text-secondary hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button className="px-6 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors">
              Save Entry
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}