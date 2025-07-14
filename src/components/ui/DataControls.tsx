import { useState } from 'react'
import { MoreVertical, Download, Upload, X } from 'lucide-react'
import { useAppData } from '../../context/AppProvider'
import { exportToCSV, downloadCSV } from '../../utils/csv'
import { useToast } from '../../hooks/useToast'
import ImportDialog from './ImportDialog'

export default function DataControls() {
  const [showMenu, setShowMenu] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const { data } = useAppData()
  const { toasts, toast, dismiss } = useToast()

  const handleExport = () => {
    try {
      const csvContent = exportToCSV(data.entries)
      const filename = `micro-invest-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
      setShowMenu(false)
      
      toast(`Exported ${data.entries.length} entries to ${filename}`, 'success')
    } catch (error) {
      console.error('Export failed:', error)
      toast('Export failed. Please try again.', 'error')
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 text-text-secondary hover:text-text-primary transition-colors"
        title="Data options"
      >
        <MoreVertical size={16} />
      </button>

      {showMenu && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu dropdown */}
          <div className="absolute right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-20 min-w-[120px]">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors rounded-lg"
            >
              <Download size={14} />
              Export CSV
            </button>
            
            <button
              onClick={() => {
                setShowImportDialog(true)
                setShowMenu(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors rounded-lg"
            >
              <Upload size={14} />
              Import CSV
            </button>
          </div>
        </>
      )}
      
      {/* Import Dialog */}
      <ImportDialog 
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
      />
      
      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`p-3 rounded-lg shadow-lg border max-w-sm transition-all duration-300 ${
                toast.type === 'error' 
                  ? 'bg-danger/10 border-danger/20 text-danger' 
                  : 'bg-accent/10 border-accent/20 text-accent'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium flex-1">{toast.message}</span>
                <button 
                  onClick={() => dismiss(toast.id)}
                  className="text-current opacity-70 hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 