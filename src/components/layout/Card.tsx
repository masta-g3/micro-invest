import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div className={`
      bg-surface rounded-lg border border-border p-6
      ${hover ? 'hover:bg-surface-hover transition-colors' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}