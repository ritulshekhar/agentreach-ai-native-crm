import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '../api'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import { Plus, Search, User, MapPin, Phone, Mail, ShoppingBag, TrendingUp, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

function AddCustomerForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '' })
  const [error, setError] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data) => customersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['customers'])
      onSuccess()
    },
    onError: (e) => setError(e.response?.data?.detail || 'Failed to create customer')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.phone || !form.city) {
      setError('All fields are required')
      return
    }
    mutation.mutate(form)
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#f87171' }}>
          {error}
        </div>
      )}
      {[
        { key: 'name', label: 'Full Name', placeholder: 'Aarav Sharma', type: 'text' },
        { key: 'email', label: 'Email', placeholder: 'aarav@example.com', type: 'email' },
        { key: 'phone', label: 'Phone', placeholder: '+91 9876543210', type: 'text' },
        { key: 'city', label: 'City', placeholder: 'Mumbai', type: 'text' },
      ].map(({ key, label, placeholder, type }) => (
        <div key={key} style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</label>
          <input
            className="input"
            type={type}
            placeholder={placeholder}
            value={form[key]}
            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? <span className="spinner" /> : <Plus size={16} />}
          Add Customer
        </button>
      </div>
    </form>
  )
}

function CustomerDetail({ customerId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customersApi.get(customerId).then(r => r.data.data),
    enabled: !!customerId,
  })

  if (isLoading) return <div className="skeleton" style={{ height: 300 }} />

  const c = data
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, color: 'white'
        }}>
          {c?.name?.[0]}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{c?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c?.customer_id}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {[
          { icon: Mail, val: c?.email },
          { icon: Phone, val: c?.phone },
          { icon: MapPin, val: c?.city },
          { icon: ShoppingBag, val: `${c?.order_count || 0} orders` },
        ].map(({ icon: Icon, val }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10 }}>
            <Icon size={15} color="var(--text-muted)" />
            <span style={{ fontSize: 13 }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div style={{ padding: '14px 18px', background: 'rgba(99,102,241,0.1)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize: 12, color: '#818cf8', marginBottom: 4 }}>Total Spent</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#818cf8' }}>
            ₹{(c?.total_spent || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div style={{ padding: '14px 18px', background: 'rgba(16,185,129,0.1)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ fontSize: 12, color: '#34d399', marginBottom: 4 }}>Joined</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#34d399' }}>
            {c?.joined_at ? format(new Date(c.joined_at), 'dd MMM yyyy') : '-'}
          </div>
        </div>
      </div>

      {/* Orders */}
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Recent Orders</div>
      {c?.orders?.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {c.orders.slice(0, 5).map(o => (
            <div key={o.order_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{o.order_id}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {o.items?.length} item(s) · {o.created_at ? format(new Date(o.created_at), 'dd MMM yyyy') : ''}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#34d399' }}>
                ₹{o.amount?.toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
          No orders yet
        </div>
      )}
    </div>
  )
}

export default function Customers() {
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page],
    queryFn: () => customersApi.list(page * limit, limit).then(r => r.data),
    keepPreviousData: true,
  })

  const customers = data?.data || []
  const total = data?.total || 0

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Customers"
        subtitle={`${total.toLocaleString()} total customers`}
        actions={
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Customer
          </button>
        }
      />

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input"
          style={{ paddingLeft: 40 }}
          placeholder="Search by name, email or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>City</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map(c => (
                <tr key={c.customer_id} onClick={() => setSelected(c.customer_id)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0
                      }}>
                        {c.name?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.customer_id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.email}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                      <MapPin size={12} color="var(--text-muted)" />
                      {c.city}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.phone}</td>
                  <td>{c.order_count || 0}</td>
                  <td style={{ fontWeight: 600, color: '#34d399' }}>
                    ₹{(c.total_spent || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {c.joined_at ? format(new Date(c.joined_at), 'dd MMM yy') : '-'}
                  </td>
                  <td><ChevronRight size={16} color="var(--text-muted)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              Prev
            </button>
            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setPage(p => p + 1)} disabled={(page + 1) * limit >= total}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Customer">
        <AddCustomerForm onSuccess={() => setShowAdd(false)} onClose={() => setShowAdd(false)} />
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Customer Details">
        <CustomerDetail customerId={selected} onClose={() => setSelected(null)} />
      </Modal>
    </div>
  )
}
