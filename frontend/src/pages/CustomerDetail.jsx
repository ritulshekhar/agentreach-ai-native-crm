import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { customersApi } from '../api'
import { ArrowLeft, User, ShoppingBag, Megaphone, TrendingUp, DollarSign, Calendar, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import EngagementTimeline from '../components/EngagementTimeline'

const CHANNEL_ICONS = { whatsapp: '💬', sms: '📱', email: '📧', rcs: '✨' }

function Kpi({ icon: Icon, label, value, sub, color = '#818cf8' }) {
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Icon size={13} color={color} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function EngagementStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer360', id],
    queryFn: () => customersApi.get360(id).then(r => r.data.data),
    enabled: !!id,
    staleTime: 30000,
  })

  if (isLoading) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', paddingTop: 80 }}>
        <span className="spinner" style={{ margin: '0 auto 16px' }} />
        <div style={{ color: 'var(--text-muted)' }}>Loading customer profile...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="animate-fade-in">
        <button className="btn-secondary" onClick={() => navigate('/customers')} style={{ marginBottom: 20 }}>
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ color: '#f87171', fontSize: 14 }}>Customer not found.</div>
      </div>
    )
  }

  const {
    name, email, phone, city, joined_at, total_spent, order_count,
    avg_order_value, last_order_at, orders = [], campaign_receipts = [],
    engagement_summary = {}, attribution = {},
  } = data

  return (
    <div className="animate-fade-in">
      {/* Back nav */}
      <button
        className="btn-secondary"
        onClick={() => navigate('/customers')}
        style={{ marginBottom: 20, padding: '8px 14px' }}
      >
        <ArrowLeft size={14} /> Back to Customers
      </button>

      {/* Profile header */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: 'white', flexShrink: 0,
          }}>
            {name?.[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 22, color: 'var(--text)', marginBottom: 2 }}>
              {name}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{email}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{phone}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} /> {city}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} /> Joined {joined_at ? format(new Date(joined_at), 'dd MMM yyyy') : '—'}
              </span>
            </div>
          </div>
          <div style={{
            background: 'rgba(99,102,241,0.1)', borderRadius: 20,
            padding: '4px 14px', fontSize: 12, fontWeight: 600, color: '#818cf8',
          }}>
            {order_count > 5 ? 'VIP' : order_count > 2 ? 'Regular' : 'New'}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <Kpi icon={ShoppingBag} label="Total Orders" value={order_count} color="#818cf8" />
        <Kpi icon={TrendingUp} label="Total Spend" value={`₹${Math.round(total_spent).toLocaleString()}`} color="#34d399" />
        <Kpi icon={DollarSign} label="Avg Order Value" value={`₹${Math.round(avg_order_value).toLocaleString()}`} color="#f59e0b" />
        <Kpi icon={Calendar} label="Last Purchase" value={last_order_at ? format(new Date(last_order_at), 'dd MMM yy') : 'Never'} color="#f472b6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Campaign Engagement */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Megaphone size={14} color="#818cf8" /> Campaign Engagement
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <EngagementStat label="Campaigns" value={engagement_summary.campaigns_received ?? 0} color="#818cf8" />
            <EngagementStat label="Delivered" value={engagement_summary.messages_delivered ?? 0} color="#34d399" />
            <EngagementStat label="Opened" value={engagement_summary.messages_opened ?? 0} color="#f59e0b" />
            <EngagementStat label="Clicked" value={engagement_summary.messages_clicked ?? 0} color="#f472b6" />
          </div>
        </div>

        {/* Revenue Attribution */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <DollarSign size={14} color="#34d399" /> Revenue Attribution
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <EngagementStat label="Attributed Revenue" value={`₹${Math.round(attribution.revenue ?? 0).toLocaleString()}`} color="#34d399" />
            <EngagementStat label="Attributed Orders" value={attribution.orders ?? 0} color="#818cf8" />
          </div>
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Revenue credited to campaigns where this customer clicked and purchased within the attribution window.
          </div>
        </div>
      </div>

      {/* Engagement Timeline */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={14} color="#818cf8" /> Activity Timeline
        </div>
        <EngagementTimeline orders={orders} receipts={campaign_receipts} />
      </div>
    </div>
  )
}
