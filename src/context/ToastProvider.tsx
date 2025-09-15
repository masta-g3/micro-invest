import React, { createContext, useContext, useState, useCallback } from 'react'
import { Toast } from '../types'
import { TOAST_DURATION } from '../constants'
import ToastContainer from '../components/ui/ToastContainer'

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error', action?: { label: string; handler: () => void }) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((
    message: string,
    type: 'success' | 'error' = 'success',
    action?: { label: string; handler: () => void }
  ) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type, action }])

    // Longer duration for action toasts
    const duration = action ? TOAST_DURATION * 2 : TOAST_DURATION
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}