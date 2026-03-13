export default function Modal({ children }) {
  return (
    <div className="fixed inset-0 bg-ink/80 flex items-center justify-center z-50 px-4">
      <div className="surface-card rounded-lg p-6 w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
