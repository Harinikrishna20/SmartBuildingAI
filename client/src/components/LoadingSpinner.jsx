export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  )
}
