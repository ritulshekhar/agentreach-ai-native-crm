import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, ShoppingBag, Target,
  Megaphone, BarChart3, Bot, Zap
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',   path: '/' },
  { icon: Users,           label: 'Customers',   path: '/customers' },
  { icon: ShoppingBag,     label: 'Orders',      path: '/orders' },
  { icon: Target,          label: 'Segments',    path: '/segments' },
  { icon: Megaphone,       label: 'Campaigns',   path: '/campaigns' },
  { icon: BarChart3,       label: 'Analytics',   path: '/analytics' },
  { icon: Bot,             label: 'AI Assistant',path: '/assistant' },
]

export default function Sidebar() {
  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 12px',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '8px 12px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
          }}>
            <Zap size={18} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
              AgentReach
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CRM Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '0 12px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Menu
        </div>
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 12px',
        borderTop: '1px solid var(--border)',
        fontSize: 12,
        color: 'var(--text-muted)'
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>v1.0.0</div>
        <div>AI-Native CRM</div>
      </div>
    </aside>
  )
}
