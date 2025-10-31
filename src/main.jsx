import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminPortal from './pages/AdminPortal'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'

function AppRouter() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing auth on mount
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      // Verify token is still valid
      fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
        .then(res => {
          if (res.ok) {
            return res.json()
          }
          throw new Error('Invalid token')
        })
        .then(data => {
          setToken(storedToken)
          // Update user data from server response (includes isAdmin)
          const userData = data.user || JSON.parse(storedUser)
          setUser(userData)
          // Update localStorage with fresh user data
          localStorage.setItem('user', JSON.stringify(userData))
        })
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'white' }}>Loading...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          token ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/signup" element={
          token ? <Navigate to="/" replace /> : <Signup onLogin={handleLogin} />
        } />
        <Route path="/" element={
          <ProtectedRoute isAuthenticated={!!token}>
            <App user={user} token={token} onLogout={handleLogout} />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute isAuthenticated={!!token}>
            <AdminPortal user={user} token={token} />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
)
