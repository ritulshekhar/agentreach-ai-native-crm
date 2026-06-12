import { useState } from 'react'
import { aiApi } from '../api'
import PageHeader from '../components/PageHeader'
import { Search, Users, Sparkles, Filter, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import AudienceInsightPanel from '../components/AudienceInsightPanel'

const EXAMPLE_QUERIES = [
  'Customers who spent more than ₹5000',
  'Customers inactive for 45 days',
  'Customers from Chennai',
  'Customers from Mumbai who spent more than ₹3000',
  'High value customers',
  'New customers in the last 30 days',
  'Customers who ordered more than 5 times',
]

export default function Segments() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [insights, setInsights] = useState(null)
  const [insightLoading, setInsightLoading] = useState(false)

  const handleSearch = async (q = prompt) => {
    if (!q.trim()) return
    setLoading(true)
    setError('')
    setInsights(null)
    try {
      const res = await aiApi.buildAudience(q)
      const data = res.data.data
      setResult(data)
      setHistory(h => [{ prompt: q, count: data.audience_count, description: data.description }, ...h.slice(0, 4)])
      // Fetch audience insights in parallel
      setInsightLoading(true)
      try {
        const insightRes = await aiApi.audienceInsights(data.mongo_filter)
        setInsights(insightRes.data.data)
      } catch {
        // Insights are non-critical — fail silently
      } finally {
        setInsightLoading(false)
      }
    } catch (e) {
      setError('Failed to build audience. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="AI Audience Builder"
        subtitle="Describe your audience in plain English — we'll find the right customers"
      />

      {/* Search Box */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, fontFamily: 'Outfit' }}>Natural Language Query</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Powered by rule-based NLP</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: 42, paddingRight: 14, fontSize: 15 }}
              placeholder='e.g. "Customers from Bangalore who spent more than ₹2000"'
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn-primary" onClick={() => handleSearch()} disabled={loading || !prompt.trim()}>
            {loading ? <span className="spinner" /> : <Filter size={16} />}
            Build Segment
          </button>
        </div>

        {/* Examples */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Try these examples:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EXAMPLE_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => { setPrompt(q); handleSearch(q) }}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                  border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Matched Customers</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#818cf8' }}>{result.audience_count}</div>
            </div>
            <div className="glass-card" style={{ padding: 20, gridColumn: 'span 2' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Segment Description</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{result.description}</div>
              <div style={{ marginTop: 8 }}>
                <code style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface2)', padding: '4px 8px', borderRadius: 6 }}>
                  {JSON.stringify(result.mongo_filter).slice(0, 100)}{JSON.stringify(result.mongo_filter).length > 100 ? '...' : ''}
                </code>
              </div>
            </div>
          </div>

          {/* Preview */}
          {result.preview?.length > 0 && (
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} color="#818cf8" />
                  Audience Preview <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>(first 10)</span>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {result.preview.map(c => (
                    <tr key={c.customer_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', fontWeight: 700 }}>
                            {c.name?.[0]}
                          </div>
                          <span style={{ fontWeight: 500 }}>{c.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.email}</td>
                      <td style={{ fontSize: 13 }}>{c.city}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Audience Insights */}
      <AudienceInsightPanel insights={insights} loading={insightLoading} />

      {/* History */}
      {history.length > 0 && (
        <div className="glass-card" style={{ padding: 20, marginTop: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--text-muted)' }}>Recent Searches</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((h, i) => (
              <div
                key={i}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, cursor: 'pointer' }}
                onClick={() => { setPrompt(h.prompt); handleSearch(h.prompt) }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{h.prompt}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.description}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#818cf8', flexShrink: 0, marginLeft: 16 }}>
                  {h.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
