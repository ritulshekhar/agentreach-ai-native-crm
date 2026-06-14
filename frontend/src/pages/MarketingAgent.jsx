import { useState } from 'react'
import { Brain, Sparkles, Target, Zap, ChevronRight, Lightbulb } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import RecommendationCard from '../components/RecommendationCard'
import { agentApi, campaignsApi } from '../api'
import { useNavigate } from 'react-router-dom'

const EXAMPLE_GOALS = [
  'Increase repeat purchases',
  'Reactivate inactive customers',
  'Upsell high value customers',
  'Bring back churned users',
  'Promote new collection',
  'Welcome new customers',
  'Run a festival promotion',
]

const STEP_LABELS = [
  { icon: Target, label: 'Define Goal', desc: 'Tell the agent your objective' },
  { icon: Brain, label: 'AI Analysis', desc: 'Agent maps goal to strategy' },
  { icon: Zap, label: 'Launch', desc: 'One-click campaign creation' },
]

export default function MarketingAgent() {
  const [goal, setGoal] = useState('')
  const [recommendation, setRecommendation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleAnalyze = async (g = goal) => {
    if (!g.trim()) return
    setLoading(true)
    setError('')
    setRecommendation(null)
    setSuccess('')
    try {
      const res = await agentApi.analyze(g)
      setRecommendation(res.data.data)
    } catch {
      setError('Agent analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!recommendation) return
    setCreating(true)
    setError('')
    try {
      const payload = {
        name: recommendation.goal_label,
        audience_filter: recommendation.audience_filter,
        audience_description: recommendation.audience_description,
        channel: recommendation.channel,
        message: recommendation.message,
      }
      const res = await agentApi.createCampaign(payload)
      setSuccess(`Campaign "${payload.name}" created with ${res.data.audience_count} customers.`)
      setTimeout(() => navigate('/campaigns'), 2000)
    } catch {
      setError('Failed to create campaign. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Marketing Agent"
        subtitle="Enter a business goal — the agent builds the campaign strategy for you"
      />

      {/* How it works */}
      <div className="glass-card" style={{ padding: '16px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {STEP_LABELS.map(({ icon: Icon, label, desc }, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(99,102,241,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={15} color="#818cf8" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
              </div>
              {i < STEP_LABELS.length - 1 && <ChevronRight size={14} color="var(--border)" style={{ marginLeft: 8 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Goal Input */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
          }}>
            <Sparkles size={17} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'Outfit' }}>Enter Your Business Goal</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>In plain English — the agent handles the rest</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="input"
            style={{ flex: 1, fontSize: 15 }}
            placeholder="e.g. &quot;Reactivate customers who haven't bought in 45 days&quot;"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
          />
          <button
            className="btn-primary"
            onClick={() => handleAnalyze()}
            disabled={loading || !goal.trim()}
            style={{ minWidth: 140 }}
          >
            {loading ? <span className="spinner" /> : <Brain size={15} />}
            {loading ? 'Analyzing...' : 'Analyze Goal'}
          </button>
        </div>

        {/* Example goals */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Lightbulb size={12} /> Try these:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EXAMPLE_GOALS.map(g => (
              <button
                key={g}
                onClick={() => { setGoal(g); handleAnalyze(g) }}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  background: 'rgba(99,102,241,0.08)', color: '#818cf8',
                  border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer',
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#f87171' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#34d399' }}>
          {success} Redirecting to campaigns...
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <RecommendationCard
          recommendation={recommendation}
          onCreateCampaign={handleCreateCampaign}
          onEdit={() => setRecommendation(null)}
          loading={creating}
        />
      )}
    </div>
  )
}
