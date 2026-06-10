import { useState, useRef, useEffect } from 'react'
import { aiApi } from '../api'
import PageHeader from '../components/PageHeader'
import { Send, Bot, User, Sparkles, MessageSquare, Mail, Phone, Zap, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'

const CHANNEL_COLORS = { whatsapp: '#25d366', sms: '#34d399', email: '#60a5fa', rcs: '#a78bfa' }
const CHANNEL_ICONS = { whatsapp: MessageSquare, sms: Phone, email: Mail, rcs: Zap }

const STARTER_PROMPTS = [
  '🔁 Reactivate inactive customers',
  '💎 Target high value customers with upsell',
  '👋 Welcome new customers',
  '🔥 Run a flash sale promotion',
  '📍 Target customers in Mumbai',
]

function SuggestionCard({ data }) {
  const Ch = CHANNEL_ICONS[data.channel] || Zap
  const color = CHANNEL_COLORS[data.channel] || '#818cf8'

  return (
    <div style={{ marginTop: 12 }}>
      {/* Audience */}
      <div style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.08)', borderRadius: 10, marginBottom: 10, border: '1px solid rgba(99,102,241,0.15)' }}>
        <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>Suggested Audience</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{data.audience_description}</div>
      </div>

      {/* Channel */}
      <div style={{ padding: '12px 16px', background: `${color}12`, borderRadius: 10, marginBottom: 10, border: `1px solid ${color}30` }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', color }}>Recommended Channel</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ch size={16} color={color} />
          <span style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize', color }}>{data.channel}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{data.reasoning}</div>
      </div>

      {/* Message */}
      <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Suggested Message</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, fontStyle: 'italic', color: 'var(--text)' }}>
          "{data.message}"
        </div>
      </div>
    </div>
  )
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your AI Campaign Assistant. Tell me what you want to achieve — I'll suggest the right audience, channel, and message for your campaign.\n\nTry: **\"Reactivate inactive customers\"** or **\"Target high value customers\"**",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text, timestamp: new Date() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await aiApi.assistant(text)
      const d = res.data.data
      setMessages(m => [...m, {
        role: 'assistant',
        content: `Here's my campaign recommendation for: **"${text}"**`,
        suggestion: d,
        timestamp: new Date()
      }])
    } catch {
      setMessages(m => [...m, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => setMessages([{
    role: 'assistant',
    content: "👋 Hi! I'm your AI Campaign Assistant. Tell me what you want to achieve — I'll suggest the right audience, channel, and message for your campaign.\n\nTry: **\"Reactivate inactive customers\"** or **\"Target high value customers\"**",
    timestamp: new Date()
  }])

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="AI Campaign Assistant"
        subtitle="Describe your goal — get instant campaign strategy"
        actions={
          <button className="btn-secondary" onClick={clearChat}>
            <RotateCcw size={15} /> Clear Chat
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, flex: 1, minHeight: 0 }}>
        {/* Chat */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: m.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {m.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="#818cf8" />}
                  </div>
                  <div>
                    <div className={m.role === 'user' ? 'chat-user' : 'chat-ai'}>
                      <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {m.content.split('**').map((part, j) =>
                          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                        )}
                      </div>
                    </div>
                    {m.suggestion && <SuggestionCard data={m.suggestion} />}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                      {format(m.timestamp, 'HH:mm')}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={16} color="#818cf8" />
                </div>
                <div className="chat-ai">
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', animation: `pulse 1s ${i * 0.2}s ease-in-out infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="input"
                placeholder="e.g. Reactivate inactive customers..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={loading}
              />
              <button
                className="btn-primary"
                style={{ padding: '10px 14px', flexShrink: 0 }}
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar prompts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={15} color="#818cf8" />
              Quick Prompts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STARTER_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p.slice(2))}
                  disabled={loading}
                  style={{
                    textAlign: 'left', padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                    fontSize: 13, color: 'var(--text)', transition: 'all 0.15s'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>How it works</div>
            {[
              { n: '1', t: 'Describe your goal' },
              { n: '2', t: 'AI identifies audience' },
              { n: '3', t: 'Gets channel recommendation' },
              { n: '4', t: 'Generates campaign message' },
            ].map(({ n, t }) => (
              <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1);   }
        }
      `}</style>
    </div>
  )
}
