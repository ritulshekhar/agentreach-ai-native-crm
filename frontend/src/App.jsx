import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Orders from './pages/Orders'
import Segments from './pages/Segments'
import Campaigns from './pages/Campaigns'
import Analytics from './pages/Analytics'
import AIAssistant from './pages/AIAssistant'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    }
  }
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{
            marginLeft: 240,
            flex: 1,
            padding: '32px 36px',
            maxWidth: 'calc(100vw - 240px)',
            overflowX: 'hidden',
          }}>
            <Routes>
              <Route path="/"           element={<Dashboard />} />
              <Route path="/customers"  element={<Customers />} />
              <Route path="/orders"     element={<Orders />} />
              <Route path="/segments"   element={<Segments />} />
              <Route path="/campaigns"  element={<Campaigns />} />
              <Route path="/analytics"  element={<Analytics />} />
              <Route path="/assistant"  element={<AIAssistant />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
