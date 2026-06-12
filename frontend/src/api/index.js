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
  get360: (id) => api.get(`/api/customers/${id}/360`),
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
  audienceInsights: (mongoFilter) => api.post('/api/analytics/audience-insights', { mongo_filter: mongoFilter }),
}

// Marketing Agent
export const agentApi = {
  analyze: (goal) => api.post('/api/agent/analyze', { goal }),
  createCampaign: (data) => api.post('/api/agent/create-campaign', data),
}

// Predictions
export const predictionsApi = {
  campaign: (channel, audienceFilter, avgOrderValue) =>
    api.post('/api/predictions/campaign', {
      channel,
      audience_filter: audienceFilter,
      avg_order_value: avgOrderValue,
    }),
}

// Templates
export const templatesApi = {
  list: () => api.get('/api/templates'),
  get: (id) => api.get(`/api/templates/${id}`),
}

// Analytics (new)
export const analyticsApi = {
  funnel: (campaignId) => api.get(`/api/analytics/funnel/${campaignId}`),
  revenue: (campaignId) => api.get(`/api/analytics/revenue/${campaignId}`),
  topCampaigns: (limit = 5) => api.get(`/api/analytics/top-campaigns?limit=${limit}`),
  overallFunnel: () => api.get('/api/analytics/overall-funnel'),
}

// Dashboard
export const dashboardApi = {
  stats: () => api.get('/api/dashboard/stats'),
}

export default api

