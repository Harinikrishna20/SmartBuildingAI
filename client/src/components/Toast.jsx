export default function Toast({ message, type = 'success', visible }) {
  if (!visible) return null

  return <div className={`toast toast--${type}`}>{message}</div>
}
