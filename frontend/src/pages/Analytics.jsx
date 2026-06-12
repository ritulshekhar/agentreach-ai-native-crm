import { useQuery } from '@tanstack/react-query'
import { campaignsApi, analyticsApi } from '../api'
import PageHeader from '../components/PageHeader'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Send, CheckCircle, XCircle, Eye, BookOpen, MousePointer, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react'
import CampaignFunnel from '../components/CampaignFunnel'

const STATUS_COLORS = {
  sent:      '#818cf8',
  delivered: '#34d399',
  failed:    '#f87171',
  opened:    '#fbbf24',
  read:      '#22d3ee',
  clicked:   '#a78bfa',
  purchased: '#f472b6',
}

const STATUS_ICONS = {
  sent:      Send,
  delivered: CheckCircle,
  failed:    XCircle,
  opened:    Eye,
  read:      BookOpen,
  clicked:   MousePointer,
  purchased: ShoppingCart,
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card" style={{ padding: '10px 14px', border: '1px solid rgba(99,102,241,0.3)' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color || p.fill }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['campaigns-analytics'],
    queryFn: () => campaignsApi.list(0, 50).then(r => r.data.data),
    refetchInterval: 15000,
  })

  const { data: overallFunnel } = useQuery({
    queryKey: ['overall-funnel'],
    queryFn: () => analyticsApi.overallFunnel().then(r => r.data.data),
    refetchInterval: 15000,
  })

  const { data: topCampaigns } = useQuery({
    queryKey: ['top-campaigns'],
    queryFn: () => analyticsApi.topCampaigns(5).then(r => r.data.data),
    refetchInterval: 30000,
  })

  // Aggregate totals
  const totals = { sent: 0, delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0, purchased: 0 }

  if (overallFunnel) {
    Object.keys(totals).forEach(k => { totals[k] = overallFunnel[k] || 0 })
  } else {
    data?.forEach(c => {
      if (c.analytics) {
        Object.keys(totals).forEach(k => { totals[k] += c.analytics[k] || 0 })
      }
    })
  }

  // Per-campaign chart data
  const campaignData = data?.slice(0, 8).map(c => ({
    name: c.name?.slice(0, 16) + (c.name?.length > 16 ? '…' : ''),
    sent: c.analytics?.sent || 0,
    delivered: c.analytics?.delivered || 0,
    failed: c.analytics?.failed || 0,
    opened: c.analytics?.opened || 0,
    read: c.analytics?.read || 0,
    clicked: c.analytics?.clicked || 0,
  })) || []

  // Pie data
  const pieData = Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([key, val]) => ({ name: key, value: val, color: STATUS_COLORS[key] }))

  // Channel breakdown
  const channelMap = {}
  data?.forEach(c => {
    if (!channelMap[c.channel]) channelMap[c.channel] = 0
    channelMap[c.channel] += c.audience_count || 0
  })
  const channelData = Object.entries(channelMap).map(([channel, count]) => ({ channel: channel.toUpperCase(), count }))

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Campaign Analytics"
        subtitle="Delivery performance across all campaigns"
      />

      {/* Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {Object.entries(totals).map(([key, val]) => {
          const Icon = STATUS_ICONS[key]
          const color = STATUS_COLORS[key]
          return (
            <div key={key} className="glass-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color }}>{isLoading ? '…' : val.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Bar Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, fontFamily: 'Outfit' }}>
            Per-Campaign Breakdown
          </div>
          {campaignData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No campaign data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={campaignData} barSize={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sent"      fill="#818cf8" radius={4} name="Sent" />
                <Bar dataKey="delivered" fill="#34d399" radius={4} name="Delivered" />
                <Bar dataKey="failed"    fill="#f87171" radius={4} name="Failed" />
                <Bar dataKey="clicked"   fill="#a78bfa" radius={4} name="Clicked" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, fontFamily: 'Outfit' }}>
            Status Distribution
          </div>
          {pieData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span style={{ fontSize: 12, textTransform: 'capitalize', color: 'var(--text-muted)' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Channel Usage */}
      {channelData.length > 0 && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, fontFamily: 'Outfit' }}>
            Channel Usage (Total Audience Reached)
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={channelData} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="channel" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#6366f1" radius={4} name="Audience" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Overall Funnel */}
      {overallFunnel && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Overall Campaign Funnel</div>
          <CampaignFunnel
            data={['sent','delivered','opened','read','clicked','purchased'].map((stage, i, arr) => {
              const count = overallFunnel[stage] || 0
              const prev = i > 0 ? (overallFunnel[arr[i-1]] || 0) : count
              return {
                stage,
                count,
                conversion_from_prev_pct: i > 0 ? (prev > 0 ? Math.round(count / prev * 100 * 10) / 10 : 0) : 100,
              }
            })}
          />
        </div>
      )}

      {/* Top Revenue Campaigns */}
      {topCampaigns?.length > 0 && (
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={16} color="#34d399" /> Top Revenue Campaigns
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Channel</th>
                <th>Audience</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>AOV</th>
              </tr>
            </thead>
            <tbody>
              {topCampaigns.map(c => (
                <tr key={c.campaign_id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ textTransform: 'uppercase', fontSize: 12 }}>{c.channel}</td>
                  <td>{c.audience_count?.toLocaleString()}</td>
                  <td>{c.orders}</td>
                  <td style={{ fontWeight: 700, color: '#34d399' }}>₹{c.revenue?.toLocaleString()}</td>
                  <td style={{ color: 'var(--text-muted)' }}>₹{c.avg_order_value?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
