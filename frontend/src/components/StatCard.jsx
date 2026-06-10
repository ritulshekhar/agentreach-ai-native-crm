export default function StatCard({ icon: Icon, label, value, sub, color = '#6366f1', trend }) {
  return (
    <div className="glass-card metric-card animate-fade-in" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>
            {label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              {sub}
            </div>
          )}
          {trend !== undefined && (
            <div style={{
              fontSize: 12, marginTop: 6, fontWeight: 500,
              color: trend >= 0 ? '#34d399' : '#f87171'
            }}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </div>
          )}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  )
}
