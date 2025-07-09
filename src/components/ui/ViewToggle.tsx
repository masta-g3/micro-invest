interface ViewToggleProps {
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function ViewToggle({ options, value, onChange, className = '' }: ViewToggleProps) {
  return (
    <div className={`flex space-x-2 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            value === option.value
              ? 'bg-accent text-background shadow-sm'
              : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
} 