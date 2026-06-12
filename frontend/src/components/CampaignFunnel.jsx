import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts'

const STAGE_COLORS = {
  sent: '#6366f1',
  delivered: '#818cf8',
  opened: '#34d399',
  read: '#10b981',
  clicked: '#f59e0b',
  purchased: '#f472b6',
  failed: '#f87171',
}

const STAGE_LABELS = {
  sent: 'Sent',
  delivered: 'Delivered',
  opened: 'Opened',
  read: 'Read',
  clicked: 'Clicked',
  purchased: 'Purchased',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
    }}>
      <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{STAGE_LABELS[d.stage] || d.stage}</div>
      <div style={{ color: 'var(--text-muted)' }}>Count: <strong style={{ color: 'var(--text)' }}>{d.count?.toLocaleString()}</strong></div>
      {d.conversion_from_prev_pct !== undefined && d.stage !== 'sent' && (
        <div style={{ color: 'var(--text-muted)' }}>
          Conv. Rate: <strong style={{ color: '#34d399' }}>{d.conversion_from_prev_pct}%</strong>
        </div>
      )}
    </div>
  )
}

export default function CampaignFunnel({ data = [], compact = false }) {
  if (!data.length) {
    return (
      <div style={{
        padding: '32px 0', textAlign: 'center',
        color: 'var(--text-muted)', fontSize: 14,
      }}>
        No funnel data yet. Launch a campaign to see results.
      </div>
    )
  }

  const filteredStages = data.filter(d => d.stage !== 'failed')

  if (compact) {
    // Horizontal bar version for dashboards
    return (
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={filteredStages} layout="vertical" margin={{ left: 60, right: 40, top: 8, bottom: 8 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="stage"
              tickFormatter={s => STAGE_LABELS[s] || s}
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
              {filteredStages.map(entry => (
                <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] || '#818cf8'} />
              ))}
              <LabelList dataKey="count" position="right" style={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Vertical funnel for detail pages
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {filteredStages.map((stage, i) => {
        const maxCount = filteredStages[0]?.count || 1
        const width = Math.max((stage.count / maxCount) * 100, 4)
        const color = STAGE_COLORS[stage.stage] || '#818cf8'
        const label = STAGE_LABELS[stage.stage] || stage.stage

        return (
          <div key={stage.stage}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 72, textAlign: 'right', fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                {label}
              </div>
              <div style={{ flex: 1, height: 32, background: 'var(--surface2)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: `${width}%`, height: '100%',
                  background: color,
                  borderRadius: 8,
                  opacity: 0.85,
                  transition: 'width 0.6s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{stage.count?.toLocaleString()}</span>
                </div>
              </div>
              {i > 0 && (
                <div style={{ width: 48, textAlign: 'left', fontSize: 11, color: '#34d399', flexShrink: 0, fontWeight: 600 }}>
                  {stage.conversion_from_prev_pct}%
                </div>
              )}
            </div>
            {i < filteredStages.length - 1 && (
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 84, marginBottom: 6 }}>
                <div style={{ width: 1, height: 14, background: 'var(--border)', marginLeft: 16 }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
