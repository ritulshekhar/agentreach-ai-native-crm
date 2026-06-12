import { Zap, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react'

const CHANNEL_COLORS = {
  whatsapp: '#25d366',
  sms: '#6366f1',
  email: '#f59e0b',
  rcs: '#818cf8',
}

export default function PredictionPanel({ prediction, channel }) {
  if (!prediction) return null

  const { rates, estimated, channel_recommendation } = prediction
  const channelColor = CHANNEL_COLORS[channel] || '#818cf8'

  return (
    <div style={{
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 20,
      background: 'rgba(99,102,241,0.03)',
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(99,102,241,0.08)',
        padding: '12px 18px',
        borderBottom: '1px solid rgba(99,102,241,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <Zap size={14} color="#818cf8" />
        <span style={{ fontWeight: 600, fontSize: 13, color: '#818cf8' }}>Pre-launch Prediction</span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 11,
          background: 'rgba(99,102,241,0.15)',
          color: '#818cf8',
          padding: '2px 8px',
          borderRadius: 20,
          fontWeight: 600,
        }}>
          AI Estimate
        </span>
      </div>

      <div style={{ padding: '16px 18px' }}>
        {/* Rate pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <StatPill label="Open Rate" value={`${rates.open_rate_pct}%`} color="#34d399" />
          <StatPill label="Click Rate" value={`${rates.ctr_pct}%`} color="#f59e0b" />
          <StatPill label="Conversion" value={`${rates.conversion_rate_pct}%`} color="#f472b6" />
        </div>

        {/* Funnel estimates */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <EstimateCard icon={<Users size={13} />} label="Delivered" value={estimated.delivered?.toLocaleString()} color="#818cf8" />
          <EstimateCard icon={<TrendingUp size={13} />} label="Opened" value={estimated.opened?.toLocaleString()} color="#34d399" />
          <EstimateCard icon={<Zap size={13} />} label="Clicked" value={estimated.clicked?.toLocaleString()} color="#f59e0b" />
          <EstimateCard icon={<DollarSign size={13} />} label="Revenue" value={`₹${(estimated.revenue_inr || 0).toLocaleString()}`} color="#f472b6" />
        </div>

        {/* Channel recommendation */}
        {channel_recommendation && channel_recommendation.channel !== channel && (
          <div style={{
            marginTop: 14,
            padding: '10px 14px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}>
            <AlertCircle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>
                Suggested: {channel_recommendation.channel?.toUpperCase()}
              </span>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {channel_recommendation.reasoning}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'var(--surface2)', borderRadius: 20,
      padding: '4px 12px', fontSize: 12,
    }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ fontWeight: 700, color }}>{value}</span>
    </div>
  )
}

function EstimateCard({ icon, label, value, color }) {
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color, marginBottom: 4 }}>
        {icon}
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
