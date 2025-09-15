import { X } from 'lucide-react'
import { Toast } from '../../types'

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
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
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <div className="flex items-center gap-2">
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action!.handler()
                    onDismiss(toast.id)
                  }}
                  className="text-xs font-medium underline hover:no-underline transition-all"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-current opacity-70 hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}