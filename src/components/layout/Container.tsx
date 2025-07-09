import { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export default function Container({ children, className = '' }: ContainerProps) {
  return (
    <div className={`max-w-4xl mx-auto px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  )
}