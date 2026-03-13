const variants = {
  primary: 'bg-accent text-ink hover:bg-accent-muted',
  secondary: 'border border-border-custom text-text-secondary hover:border-olive hover:text-text-primary',
  danger: 'bg-danger text-text-primary hover:bg-danger-hover',
}

const sizes = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2',
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <button
      {...props}
      className={`rounded font-semibold transition-colors disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}
