import { ShoppingBag, Megaphone, CheckCircle, XCircle, Eye, MousePointer, ShoppingCart } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_CONFIG = {
  sent: { color: '#818cf8', label: 'Sent', icon: Megaphone },
  delivered: { color: '#34d399', label: 'Delivered', icon: CheckCircle },
  opened: { color: '#10b981', label: 'Opened', icon: Eye },
  read: { color: '#10b981', label: 'Read', icon: Eye },
  clicked: { color: '#f59e0b', label: 'Clicked', icon: MousePointer },
  purchased: { color: '#f472b6', label: 'Purchased', icon: ShoppingCart },
  failed: { color: '#f87171', label: 'Failed', icon: XCircle },
}

const CHANNEL_ICONS = { whatsapp: '💬', sms: '📱', email: '📧', rcs: '✨' }

function TimelineItem({ item, isLast }) {
  const isOrder = item.type === 'order'
  const config = isOrder ? null : STATUS_CONFIG[item.status] || STATUS_CONFIG.sent
  const Icon = isOrder ? ShoppingBag : (config?.icon || Megaphone)
  const color = isOrder ? '#34d399' : config?.color || '#818cf8'

  const ts = item.timestamp || item.created_at
  const timeStr = ts ? format(new Date(ts), 'dd MMM yyyy, HH:mm') : ''

  return (
    <div style={{ display: 'flex', gap: 14, position: 'relative' }}>
      {/* Connector line */}
      {!isLast && (
        <div style={{
          position: 'absolute', left: 15, top: 32, width: 1,
          height: 'calc(100% - 8px)', background: 'var(--border)',
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: `${color}20`, border: `1.5px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, zIndex: 1,
      }}>
        <Icon size={13} color={color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
            {isOrder ? (
              <>Order <span style={{ color: '#818cf8' }}>#{item.order_id}</span> — ₹{item.amount?.toLocaleString()}</>
            ) : (
              <>
                {CHANNEL_ICONS[item.campaign_channel] || '📨'}{' '}
                <span style={{ color }}>{config?.label}</span>
                {' via '}
                <span style={{ fontWeight: 500 }}>{item.campaign_name}</span>
              </>
            )}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 12 }}>{timeStr}</span>
        </div>

        {isOrder && item.items?.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {item.items.map(i => i.name).join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}

export default function EngagementTimeline({ orders = [], receipts = [] }) {
  // Merge and sort by timestamp
  const orderEvents = orders.map(o => ({ ...o, type: 'order', timestamp: o.created_at }))
  const receiptEvents = receipts.map(r => ({ ...r, type: 'receipt' }))
  const allEvents = [...orderEvents, ...receiptEvents].sort((a, b) => {
    const ta = new Date(a.timestamp || 0).getTime()
    const tb = new Date(b.timestamp || 0).getTime()
    return tb - ta // newest first
  })

  if (!allEvents.length) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
        No activity yet for this customer.
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {allEvents.map((event, i) => (
        <TimelineItem
          key={`${event.type}-${event.order_id || event.campaign_id}-${i}`}
          item={event}
          isLast={i === allEvents.length - 1}
        />
      ))}
    </div>
  )
}
