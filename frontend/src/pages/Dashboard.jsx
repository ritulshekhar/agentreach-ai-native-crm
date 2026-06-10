import { useQuery } from '@tanstack/react-query'
import { dashboardApi, ordersApi } from '../api'
import StatCard from '../components/StatCard'
import PageHeader from '../components/PageHeader'
import {
  Users, ShoppingBag, Megaphone, TrendingUp,
  Send, CheckCircle, XCircle
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { format } from 'date-fns'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card" style={{ padding: '10px 14px', border: '1px solid rgba(99,102,241,0.3)' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color }}>
          ₹{p.value?.toLocaleString('en-IN')}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then(r => r.data.data),
    refetchInterval: 30000,
  })

  const monthlyData = stats?.monthly_revenue?.map(m => ({
    name: MONTHS[m._id.month - 1],
    revenue: Math.round(m.revenue),
    orders: m.orders,
  })) || []

  const delivery = stats?.delivery_summary || {}

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle={`Good evening! Here's your CRM overview.`}
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="glass-card skeleton" style={{ height: 110 }} />
          ))
        ) : (
          <>
            <StatCard icon={Users} label="Total Customers" value={stats?.total_customers?.toLocaleString() || '0'} color="#6366f1" sub="Registered shoppers" />
            <StatCard icon={ShoppingBag} label="Total Orders" value={stats?.total_orders?.toLocaleString() || '0'} color="#10b981" sub="All time" />
            <StatCard icon={TrendingUp} label="Total Revenue" value={`₹${(stats?.total_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} color="#f59e0b" sub={`Avg ₹${(stats?.avg_order_value || 0).toFixed(0)}/order`} />
            <StatCard icon={Megaphone} label="Campaigns" value={stats?.total_campaigns?.toLocaleString() || '0'} color="#8b5cf6" sub="Active campaigns" />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Revenue Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, fontFamily: 'Outfit' }}>
            Monthly Revenue
          </div>
          {isLoading ? (
            <div className="skeleton" style={{ height: 220 }} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Delivery Stats */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, fontFamily: 'Outfit' }}>
            Delivery Overview
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Sent',      icon: Send,         val: delivery.sent || 0,      color: '#818cf8' },
              { label: 'Delivered', icon: CheckCircle,  val: delivery.delivered || 0, color: '#34d399' },
              { label: 'Failed',    icon: XCircle,      val: delivery.failed || 0,    color: '#f87171' },
            ].map(({ label, icon: Icon, val, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color }}>{val.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, fontFamily: 'Outfit' }}>
          Recent Campaigns
        </div>
        {isLoading ? (
          <div className="skeleton" style={{ height: 120 }} />
        ) : !stats?.recent_campaigns?.length ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No campaigns yet. Create your first campaign!
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Channel</th>
                <th>Audience</th>
                <th>Sent</th>
                <th>Delivered</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_campaigns.map(c => (
                <tr key={c.campaign_id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td><span style={{ textTransform: 'capitalize' }}>{c.channel}</span></td>
                  <td>{c.audience_count}</td>
                  <td>{c.analytics?.sent || 0}</td>
                  <td>{c.analytics?.delivered || 0}</td>
                  <td><span className="badge badge-active">{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
