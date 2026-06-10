import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
})

// Customers
export const customersApi = {
  list: (skip = 0, limit = 50) => api.get(`/api/customers?skip=${skip}&limit=${limit}`),
  create: (data) => api.post('/api/customers', data),
  get: (id) => api.get(`/api/customers/${id}`),
}

// Orders
export const ordersApi = {
  list: (skip = 0, limit = 50) => api.get(`/api/orders?skip=${skip}&limit=${limit}`),
  create: (data) => api.post('/api/orders', data),
  stats: () => api.get('/api/orders/stats/summary'),
}

// Campaigns
export const campaignsApi = {
  list: (skip = 0, limit = 50) => api.get(`/api/campaigns?skip=${skip}&limit=${limit}`),
  create: (data) => api.post('/api/campaigns', data),
  get: (id) => api.get(`/api/campaigns/${id}`),
  analytics: (id) => api.get(`/api/campaigns/${id}/analytics`),
}

// AI
export const aiApi = {
  buildAudience: (prompt) => api.post('/api/ai/audience', { prompt }),
  assistant: (message) => api.post('/api/ai/assistant', { message }),
}

// Dashboard
export const dashboardApi = {
  stats: () => api.get('/api/dashboard/stats'),
}

export default api
