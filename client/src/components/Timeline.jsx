export default function Timeline({ items = [] }) {
  return (
    <div className="timeline">
      {items.map((item, index) => {
        const finished = index < items.length - 1
        const current = index === items.length - 1 && items.length > 0

        return (
          <div className="timeline__item" key={`${item}-${index}`}>
            <span className={`timeline__dot ${finished ? 'is-done' : current ? 'is-current' : 'is-pending'}`} />
            <span>{item}</span>
          </div>
        )
      })}
    </div>
  )
}
