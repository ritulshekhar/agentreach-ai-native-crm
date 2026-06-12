import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { Users, TrendingUp, MapPin, RefreshCw, ShoppingBag } from 'lucide-react'

const CITY_COLORS = ['#6366f1', '#818cf8', '#34d399', '#f59e0b', '#f472b6', '#60a5fa', '#a78bfa', '#10b981']
const SPEND_COLOR = '#818cf8'

function InsightCard({ icon: Icon, label, value, sub, color = '#818cf8' }) {
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Icon size={13} color={color} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <strong>{payload[0].name}</strong>: {payload[0].value} customers
    </div>
  )
}

export default function AudienceInsightPanel({ insights, loading }) {
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 28, marginTop: 20, textAlign: 'center' }}>
        <span className="spinner" style={{ margin: '0 auto 12px' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Analyzing audience...</div>
      </div>
    )
  }

  if (!insights) return null

  const {
    audience_size, avg_spend, median_spend, repeat_purchase_rate,
    top_cities, city_distribution, spend_buckets, recent_activity_30d,
  } = insights

  return (
    <div className="glass-card animate-fade-in" style={{ padding: 24, marginTop: 20 }}>
      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, marginBottom: 20, color: 'var(--text)' }}>
        Audience Insights
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <InsightCard icon={Users} label="Audience Size" value={audience_size?.toLocaleString()} color="#818cf8" />
        <InsightCard icon={TrendingUp} label="Avg Spend" value={`₹${Math.round(avg_spend).toLocaleString()}`} sub="lifetime" color="#34d399" />
        <InsightCard icon={TrendingUp} label="Median Spend" value={`₹${Math.round(median_spend).toLocaleString()}`} sub="50th percentile" color="#f59e0b" />
        <InsightCard icon={RefreshCw} label="Repeat Rate" value={`${repeat_purchase_rate}%`} sub="2+ orders" color="#f472b6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* City distribution pie */}
        {city_distribution?.length > 0 && (
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} color="#818cf8" /> Customer Distribution by City
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={city_distribution}
                    dataKey="count"
                    nameKey="city"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={35}
                  >
                    {city_distribution.map((entry, i) => (
                      <Cell key={entry.city} fill={CITY_COLORS[i % CITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {city_distribution.map((entry, i) => (
                <div key={entry.city} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: CITY_COLORS[i % CITY_COLORS.length] }} />
                  <span style={{ color: 'var(--text-muted)' }}>{entry.city} ({entry.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spend range bar chart */}
        {spend_buckets?.length > 0 && (
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShoppingBag size={13} color="#818cf8" /> Spend Distribution
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={spend_buckets} margin={{ left: -20 }}>
                  <XAxis dataKey="range" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [v, 'Customers']}
                  />
                  <Bar dataKey="count" fill={SPEND_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {top_cities?.length > 0 && (
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8, fontSize: 12 }}>
          <span style={{ color: 'var(--text-muted)' }}>Top cities: </span>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{top_cities.join(', ')}</span>
          {recent_activity_30d > 0 && (
            <span style={{ color: 'var(--text-muted)' }}> · <strong style={{ color: '#34d399' }}>{recent_activity_30d}</strong> orders in last 30 days</span>
          )}
        </div>
      )}
    </div>
  )
}
