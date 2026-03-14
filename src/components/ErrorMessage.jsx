export default function ErrorMessage({ error }) {
  if (!error) return null
  return (
    <div className="bg-danger/20 border border-danger/40 text-danger px-4 py-2 rounded mb-4 text-sm">
      {error}
    </div>
  )
}
