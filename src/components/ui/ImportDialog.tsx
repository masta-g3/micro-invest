import { useState } from 'react'
import { Upload } from 'lucide-react'
import { useDataImport } from '../../hooks/useDataImport'
import { ImportResult } from '../../types'
import Modal from './Modal'
import Button from './Button'

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import CSV Data">
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
              <Button variant="secondary" onClick={handleReset} className="flex-1">
                Try Again
              </Button>
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
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
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!file || importing}
                className="flex-1"
              >
                {importing ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </div>
        )}
    </Modal>
  )
} 