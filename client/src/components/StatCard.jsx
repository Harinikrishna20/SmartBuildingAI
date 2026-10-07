export default function StatCard({ title, value, accent = 'navy', icon: Icon }) {
  return (
    <div className="stat-card card-surface">
      <div className="stat-card__header">
        <div>
          <p className="eyebrow">{title}</p>
          <h3>{value}</h3>
        </div>
        {Icon ? (
          <div className={`stat-icon stat-icon--${accent}`}>
            <Icon size={18} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
