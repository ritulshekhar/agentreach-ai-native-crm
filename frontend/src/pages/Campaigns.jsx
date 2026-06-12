import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignsApi, aiApi, templatesApi, predictionsApi } from '../api'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import { Plus, Megaphone, MessageSquare, Mail, Phone, Zap, ChevronRight, Sparkles, LayoutTemplate } from 'lucide-react'
import { format } from 'date-fns'
import TemplateCard from '../components/TemplateCard'
import PredictionPanel from '../components/PredictionPanel'

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: '#25d366' },
  { value: 'sms',      label: 'SMS',      icon: Phone,          color: '#34d399' },
  { value: 'email',    label: 'Email',    icon: Mail,           color: '#60a5fa' },
  { value: 'rcs',      label: 'RCS',      icon: Zap,            color: '#a78bfa' },
]

const AUDIENCE_PRESETS = [
  { label: 'All Customers',             filter: {}, desc: 'All registered customers' },
  { label: 'High Value (>₹10,000)',     filter: { total_spent: { '$gt': 10000 } }, desc: 'Spent over ₹10,000' },
  { label: 'Inactive 45+ days',         filter: {}, desc: 'Not ordered in 45 days', nlp: 'Customers inactive for 45 days' },
  { label: 'From Mumbai',               filter: { city: { '$regex': 'Mumbai', '$options': 'i' } }, desc: 'Customers in Mumbai' },
  { label: 'From Delhi',                filter: { city: { '$regex': 'Delhi',  '$options': 'i' } }, desc: 'Customers in Delhi' },
  { label: 'From Bangalore',            filter: { city: { '$regex': 'Bangalore', '$options': 'i' } }, desc: 'Customers in Bangalore' },
]

function CreateCampaignForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({
    name: '',
    audience_filter: {},
    audience_description: 'All customers',
    channel: 'whatsapp',
    message: '',
  })
  const [audienceCount, setAudienceCount] = useState(null)
  const [nlpPrompt, setNlpPrompt] = useState('')
  const [nlpLoading, setNlpLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [predLoading, setPredLoading] = useState(false)
  const qc = useQueryClient()

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list().then(r => r.data.data),
    staleTime: Infinity,
  })

  const mutation = useMutation({
    mutationFn: (data) => campaignsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['campaigns'])
      onSuccess()
    },
    onError: (e) => setError(e.response?.data?.detail || 'Failed to create campaign')
  })

  const runNLP = async () => {
    if (!nlpPrompt.trim()) return
    setNlpLoading(true)
    try {
      const res = await aiApi.buildAudience(nlpPrompt)
      const d = res.data.data
      setForm(p => ({ ...p, audience_filter: d.mongo_filter, audience_description: d.description }))
      setAudienceCount(d.audience_count)
    } finally {
      setNlpLoading(false)
    }
  }

  const selectPreset = (preset) => {
    setForm(p => ({ ...p, audience_filter: preset.filter, audience_description: preset.desc }))
    setAudienceCount(null)
    setPrediction(null)
  }

  const applyTemplate = (tpl) => {
    setForm(p => ({
      ...p,
      name: p.name || tpl.name,
      audience_filter: tpl.audience_filter,
      audience_description: tpl.audience_description,
      channel: tpl.channel,
      message: tpl.message,
    }))
    setShowTemplates(false)
    setPrediction(null)
    setAudienceCount(null)
  }

  const getPrediction = async () => {
    setPredLoading(true)
    try {
      const res = await predictionsApi.campaign(form.channel, form.audience_filter)
      setPrediction(res.data.data)
    } catch {
      // non-critical
    } finally {
      setPredLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.message) { setError('Name and message are required'); return }
    mutation.mutate(form)
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 }}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#f87171' }}>{error}</div>
      )}

      {/* Template Picker */}
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setShowTemplates(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: '#818cf8', background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '6px 12px',
            cursor: 'pointer', fontWeight: 600,
          }}
        >
          <LayoutTemplate size={13} /> Start from a template
        </button>
        {showTemplates && templates.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            {templates.map(tpl => (
              <TemplateCard key={tpl.id} template={tpl} onSelect={applyTemplate} />
            ))}
          </div>
        )}
      </div>

      {/* Campaign Name */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>Campaign Name *</label>
        <input className="input" placeholder="Summer Re-engagement" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
      </div>

      {/* Audience */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>Audience</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {AUDIENCE_PRESETS.map(p => (
            <button
              type="button" key={p.label}
              onClick={() => selectPreset(p)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                background: form.audience_description === p.desc ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                color: form.audience_description === p.desc ? '#818cf8' : 'var(--text-muted)',
                border: `1px solid ${form.audience_description === p.desc ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
              }}
            >{p.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder='Or type: "Customers from Chennai who spent > ₹2000"' value={nlpPrompt} onChange={e => setNlpPrompt(e.target.value)} />
          <button type="button" className="btn-secondary" style={{ whiteSpace: 'nowrap', padding: '10px 14px' }} onClick={runNLP} disabled={nlpLoading}>
            {nlpLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Sparkles size={14} />}
          </button>
        </div>
        {audienceCount !== null && (
          <div style={{ marginTop: 8, fontSize: 13, color: '#818cf8', fontWeight: 500 }}>
            ✓ {audienceCount} customers matched
          </div>
        )}
        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
          Selected: {form.audience_description}
        </div>
      </div>

      {/* Channel */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>Channel</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {CHANNELS.map(({ value, label, icon: Icon, color }) => (
            <button
              type="button" key={value}
              onClick={() => setForm(p => ({ ...p, channel: value }))}
              style={{
                padding: '10px 8px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                background: form.channel === value ? `${color}20` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${form.channel === value ? color + '60' : 'var(--border)'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
              }}
            >
              <Icon size={18} color={form.channel === value ? color : 'var(--text-muted)'} />
              <span style={{ fontSize: 12, fontWeight: 500, color: form.channel === value ? color : 'var(--text-muted)' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
          Message * <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>(use {'{name}'} for personalization)</span>
        </label>
        <textarea
          className="input"
          rows={4}
          placeholder="Hi {name}! 🎉 We have an exclusive offer for you..."
          value={form.message}
          onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
          style={{ resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      {/* Prediction */}
      {prediction && <PredictionPanel prediction={prediction} channel={form.channel} />}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button
          type="button" className="btn-secondary"
          onClick={getPrediction} disabled={predLoading}
          style={{ color: '#818cf8' }}
        >
          {predLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Zap size={14} />}
          Predict
        </button>
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? <span className="spinner" /> : <Megaphone size={16} />}
          Launch Campaign
        </button>
      </div>
    </form>
  )
}

export default function Campaigns() {
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.list(0, 50).then(r => r.data),
    refetchInterval: 15000,
  })

  const campaigns = data?.data || []

  const getChannelColor = (ch) => CHANNELS.find(c => c.value === ch)?.color || '#818cf8'
  const getChannelIcon = (ch) => CHANNELS.find(c => c.value === ch)?.icon || Zap

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Campaigns"
        subtitle={`${campaigns.length} campaigns`}
        actions={
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Campaign
          </button>
        }
      />

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {Array(4).fill(0).map((_, i) => <div key={i} className="glass-card skeleton" style={{ height: 180 }} />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
          <Megaphone size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No campaigns yet</div>
          <div style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Create your first campaign to engage customers</div>
          <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Create Campaign</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {campaigns.map(c => {
            const color = getChannelColor(c.channel)
            const Icon = getChannelIcon(c.channel)
            return (
              <div key={c.campaign_id} className="glass-card animate-fade-in" style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, fontFamily: 'Outfit' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.audience_description}</div>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={17} color={color} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  <div style={{ padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Audience</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color }}>{c.audience_count}</div>
                  </div>
                  <div style={{ padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Channel</div>
                    <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize', color }}>{c.channel}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-active">{c.status}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {c.created_at ? format(new Date(c.created_at), 'dd MMM yyyy') : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Campaign">
        <CreateCampaignForm onSuccess={() => setShowCreate(false)} onClose={() => setShowCreate(false)} />
      </Modal>
    </div>
  )
}
