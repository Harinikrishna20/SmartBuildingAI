export default function PriorityBadge({ value, label }) {
  const normalized = Number(value)
  let tone = 'priority-low'

  if (normalized >= 80) tone = 'priority-critical'
  else if (normalized >= 60) tone = 'priority-high'
  else if (normalized >= 35) tone = 'priority-medium'

  return <span className={`priority-badge ${tone}`}>{label || `${value}/100`}</span>
}
