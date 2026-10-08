export default function Timeline({ items = [] }) {
  return (
    <div className="timeline">
      {items.map((item, index) => {
        const timelineItem = typeof item === 'string' ? { status: item } : item
        const finished = Boolean(timelineItem.completed)
        const current = Boolean(timelineItem.current) && !finished

        return (
          <div
            className={`timeline__item ${finished ? 'is-complete' : current ? 'is-current' : 'is-pending'}`}
            key={`${timelineItem.key || timelineItem.status}-${index}`}
          >
            <span className={`timeline__dot ${finished ? 'is-done' : current ? 'is-current' : 'is-pending'}`}>
              {finished ? '✓' : current ? '→' : '○'}
            </span>
            <span className={`timeline__status ${finished ? 'is-completed-text' : ''}`}>
              {timelineItem.status}
            </span>
          </div>
        )
      })}
    </div>
  )
}
