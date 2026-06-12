import { CheckCircle, RefreshCw, TrendingUp, Gift, Star } from 'lucide-react'

const ICON_MAP = {
  'refresh-cw': RefreshCw,
  'trending-up': TrendingUp,
  'user-check': CheckCircle,
  'gift': Gift,
  'star': Star,
}

const CHANNEL_ICONS = { whatsapp: '💬', sms: '📱', email: '📧', rcs: '✨' }

export default function TemplateCard({ template, onSelect, selected }) {
  const Icon = ICON_MAP[template.icon] || Star

  return (
    <div
      onClick={() => onSelect(template)}
      style={{
        background: selected ? `rgba(99,102,241,0.08)` : 'var(--surface2)',
        border: selected ? `1.5px solid ${template.color}` : '1.5px solid var(--border)',
        borderRadius: 12,
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!selected) e.currentTarget.style.borderColor = template.color + '60'
      }}
      onMouseLeave={e => {
        if (!selected) e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: template.color,
          borderRadius: '50%', width: 18, height: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle size={11} color="white" />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${template.color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color={template.color} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{template.name}</div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
        {template.description}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {template.tags?.map(tag => (
            <span key={tag} style={{
              fontSize: 10, fontWeight: 600,
              background: `${template.color}15`, color: template.color,
              padding: '2px 7px', borderRadius: 20,
            }}>
              {tag}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 16 }}>{CHANNEL_ICONS[template.channel]}</span>
      </div>
    </div>
  )
}
