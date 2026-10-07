import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, ReferenceArea } from 'recharts'

export default function UtilityChart({ data, dataKey = 'usage', color = '#2a6f97', title = 'Actual vs Predicted Consumption', normalMin, normalMax }) {
  return (
    <div className="chart-card card-surface">
      <div className="section-head">
        <h3>{title}</h3>
      </div>

      <div className="chart-box">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 24 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            {normalMin !== undefined && normalMax !== undefined ? (
              <ReferenceArea y1={normalMin} y2={normalMax} fill="#d7f5eb" fillOpacity={0.5} />
            ) : null}
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey={dataKey} stroke="none" fill={color} fillOpacity={0.08} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
