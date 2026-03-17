export default function Input({ label, ...props }) {
  const inputId = props.id || (label ? label.toLowerCase().replace(/[sW]+/g, '-') : undefined)

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className="w-full bg-surface border border-border-custom text-text-primary rounded px-3 py-2 placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
  )
}
