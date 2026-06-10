import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi, customersApi } from '../api'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import { Plus, ShoppingBag, TrendingUp, Package } from 'lucide-react'
import { format } from 'date-fns'

function AddOrderForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({ customer_id: '', amount: '', items: [{ name: '', quantity: 1, price: '' }] })
  const [error, setError] = useState('')
  const qc = useQueryClient()

  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customersApi.list(0, 200).then(r => r.data.data),
  })

  const mutation = useMutation({
    mutationFn: (data) => ordersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['orders'])
      qc.invalidateQueries(['order-stats'])
      onSuccess()
    },
    onError: (e) => setError(e.response?.data?.detail || 'Failed to create order')
  })

  const updateItem = (i, key, val) => {
    setForm(p => {
      const items = [...p.items]
      items[i] = { ...items[i], [key]: val }
      const total = items.reduce((sum, it) => sum + (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 0), 0)
      return { ...p, items, amount: total }
    })
  }

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { name: '', quantity: 1, price: '' }] }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      customer_id: form.customer_id,
      amount: parseFloat(form.amount),
      items: form.items.map(it => ({ name: it.name, quantity: parseInt(it.quantity), price: parseFloat(it.price) }))
    }
    if (!payload.customer_id || !payload.amount || payload.items.some(i => !i.name)) {
      setError('Please fill all required fields')
      return
    }
    mutation.mutate(payload)
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#f87171' }}>
          {error}
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>Customer *</label>
        <select
          className="input"
          value={form.customer_id}
          onChange={e => setForm(p => ({ ...p, customer_id: e.target.value }))}
          style={{ background: 'var(--surface2)' }}
        >
          <option value="">Select customer...</option>
          {customersData?.map(c => (
            <option key={c.customer_id} value={c.customer_id}>{c.name} — {c.customer_id}</option>
          ))}
        </select>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-muted)' }}>Items</div>
      {form.items.map((item, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
          <input className="input" placeholder="Item name" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} />
          <input className="input" type="number" placeholder="Qty" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
          <input className="input" type="number" placeholder="Price ₹" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} />
        </div>
      ))}

      <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, marginBottom: 16 }} onClick={addItem}>
        + Add Item
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(99,102,241,0.1)', borderRadius: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>Total Amount</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#818cf8' }}>₹{(parseFloat(form.amount) || 0).toLocaleString('en-IN')}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? <span className="spinner" /> : <Plus size={16} />}
          Create Order
        </button>
      </div>
    </form>
  )
}

export default function Orders() {
  const [showAdd, setShowAdd] = useState(false)
  const [page, setPage] = useState(0)
  const limit = 25

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => ordersApi.list(page * limit, limit).then(r => r.data),
  })

  const { data: statsData } = useQuery({
    queryKey: ['order-stats'],
    queryFn: () => ordersApi.stats().then(r => r.data.data),
  })

  const orders = data?.data || []
  const total = data?.total || 0

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Orders"
        subtitle={`${total.toLocaleString()} total orders`}
        actions={
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Order
          </button>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={ShoppingBag} label="Total Orders" value={statsData?.total_orders?.toLocaleString() || '0'} color="#6366f1" />
        <StatCard icon={TrendingUp} label="Total Revenue" value={`₹${(statsData?.total_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} color="#10b981" />
        <StatCard icon={Package} label="Avg Order Value" value={`₹${(statsData?.avg_order_value || 0).toFixed(0)}`} color="#f59e0b" />
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(5).fill(0).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : orders.map(o => (
                <tr key={o.order_id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13, color: '#818cf8' }}>{o.order_id}</td>
                  <td style={{ fontSize: 13 }}>{o.customer_id}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {o.items?.map(it => it.name).join(', ').slice(0, 40)}{o.items?.length > 1 ? '…' : ''}
                  </td>
                  <td style={{ fontWeight: 600, color: '#34d399' }}>₹{o.amount?.toLocaleString('en-IN')}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {o.created_at ? format(new Date(o.created_at), 'dd MMM yyyy HH:mm') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</button>
            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setPage(p => p + 1)} disabled={(page + 1) * limit >= total}>Next</button>
          </div>
        </div>
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Create Order">
        <AddOrderForm onSuccess={() => setShowAdd(false)} onClose={() => setShowAdd(false)} />
      </Modal>
    </div>
  )
}
