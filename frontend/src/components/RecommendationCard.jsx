import { Users, Zap, MessageSquare, TrendingUp, CheckCircle, Edit3 } from 'lucide-react'

const CHANNEL_ICONS = { whatsapp: '💬', sms: '📱', email: '📧', rcs: '✨' }
const CHANNEL_COLORS = {
  whatsapp: '#25d366',
  sms: '#6366f1',
  email: '#f59e0b',
  rcs: '#818cf8',
}

export default function RecommendationCard({ recommendation, onCreateCampaign, onEdit, loading }) {
  if (!recommendation) return null

  const {
    goal, goal_label, audience_description, audience_count,
    channel, message, reasoning, estimated_open_rate,
    estimated_ctr, estimated_conversion, channel_recommendation,
  } = recommendation

  const channelColor = CHANNEL_COLORS[channel] || '#818cf8'

  return (
    <div className="glass-card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
        padding: '20px 24px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
          Agent Recommendation
        </div>
        <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
          {goal_label}
        </div>
        {goal && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Goal: "{goal}"
          </div>
        )}
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
              <Users size={14} color="#818cf8" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Estimated Reach</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#818cf8' }}>{audience_count?.toLocaleString() ?? '—'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>customers</div>
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
              <TrendingUp size={14} color="#34d399" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Est. Open Rate</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#34d399' }}>{estimated_open_rate}%</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>for {channel}</div>
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
              <Zap size={14} color="#f59e0b" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Est. Conversion</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#f59e0b' }}>{estimated_conversion}%</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>click-to-purchase</div>
          </div>
        </div>

        {/* Audience + Channel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Recommended Audience
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{audience_description}</div>
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Recommended Channel
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{CHANNEL_ICONS[channel]}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: channelColor, textTransform: 'uppercase' }}>
                {channel}
              </span>
            </div>
            {channel_recommendation && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {channel_recommendation.confidence}% confidence
              </div>
            )}
          </div>
        </div>

        {/* Suggested Message */}
        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <MessageSquare size={13} color="#818cf8" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Suggested Message
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{message}</div>
        </div>

        {/* Reasoning */}
        {reasoning && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, fontStyle: 'italic', paddingLeft: 12, borderLeft: '2px solid var(--border)' }}>
            {reasoning}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-primary"
            style={{ flex: 1 }}
            onClick={onCreateCampaign}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : <CheckCircle size={15} />}
            Create Campaign
          </button>
          {onEdit && (
            <button
              className="btn-secondary"
              onClick={onEdit}
              style={{ padding: '0 20px' }}
            >
              <Edit3 size={15} />
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
