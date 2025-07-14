import { useState } from 'react'
import { X, Upload } from 'lucide-react'
import { useDataImport } from '../../hooks/useDataImport'

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface ImportResult {
  success: boolean
  errors?: string[]
  count?: number
}

export default function ImportDialog({ isOpen, onClose }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const { importCSV } = useDataImport()

  const handleImport = async () => {
    if (!file) return
    
    setImporting(true)
    const importResult = await importCSV(file, 'merge') // Default to merge
    setResult(importResult)
    setImporting(false)
    
    if (importResult.success) {
      // Auto-close on success after brief delay
      setTimeout(() => {
        onClose()
        setFile(null)
        setResult(null)
      }, 1500)
    }
  }

  const handleReset = () => {
    setResult(null)
    setFile(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-surface border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Import CSV Data</h2>
          <button 
            onClick={onClose}
            className="p-1 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        {result?.success ? (
          /* Success State */
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-accent text-xl">✓</span>
            </div>
            <p className="text-text-primary font-medium">Import Successful</p>
            <p className="text-text-secondary text-sm mt-1">
              Added {result.count} entries to your portfolio
            </p>
          </div>
        ) : result?.errors ? (
          /* Error State */
          <div>
            <div className="mb-4">
              <p className="text-danger font-medium mb-2">Import Failed</p>
              <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
                <ul className="text-sm text-danger space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleReset}
                className="flex-1 border border-border rounded-lg py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={onClose}
                className="flex-1 bg-accent text-background rounded-lg py-2 hover:bg-accent/80 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Upload State */
          <div>
            <div className="mb-4">
              <label className="block border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent/50 transition-colors">
                <Upload className="w-8 h-8 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary mb-2">Drop CSV file here or click to browse</p>
                <p className="text-xs text-text-muted">Expected format: Date,Investment,Amount,Rate</p>
                
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="sr-only"
                />
              </label>
              
              {file && (
                <p className="text-sm text-text-primary mt-2">
                  Selected: {file.name}
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 border border-border rounded-lg py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                disabled={!file || importing}
                className="flex-1 bg-accent text-background rounded-lg py-2 hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 