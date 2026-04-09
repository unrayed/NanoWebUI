import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ConfigEditor from './pages/ConfigEditor'
import ProvidersPage from './pages/ProvidersPage'
import ToolsPage from './pages/ToolsPage'
import SettingsPage from './pages/SettingsPage'
import ForcePasswordChange from './pages/ForcePasswordChange'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const forceChange = useAuthStore((s) => s.forceChange)

  if (!token) return <Navigate to="/login" replace />
  if (forceChange) return <Navigate to="/force-change" replace />
  return <>{children}</>
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/force-change" element={<ForcePasswordChange />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="config" element={<ConfigEditor />} />
          <Route path="providers" element={<ProvidersPage />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
