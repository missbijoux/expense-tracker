import React, { useState, useEffect } from 'react'
import TributeLeaderboard from '../components/TributeLeaderboard'
import './AdminPortal.css'

function AdminPortal({ user, token }) {
  const [stats, setStats] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState({ category: '', userId: '' })

  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`
    }
  }

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token])

  const fetchData = async () => {
    try {
      const [statsRes, expensesRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: getAuthHeaders() }),
        fetch('/api/admin/expenses', { headers: getAuthHeaders() }),
        fetch('/api/admin/users', { headers: getAuthHeaders() })
      ])
      
      if (statsRes.status === 403) {
        // User is not admin
        setError('Access denied. Admin privileges required.')
        setLoading(false)
        return
      }
      
      if (!statsRes.ok) {
        const errorData = await statsRes.json().catch(() => ({ error: 'Failed to load admin data' }))
        setError(errorData.error || 'Failed to load admin data')
        setLoading(false)
        return
      }
      
      if (statsRes.ok && expensesRes.ok) {
        const statsData = await statsRes.json()
        const expensesData = await expensesRes.json()
        const usersData = usersRes.ok ? await usersRes.json() : []
        
        setStats(statsData)
        setExpenses(expensesData)
        setUsers(usersData)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Error loading admin data. Please try again.')
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Export all expenses as CSV
  const handleExportMasterCSV = () => {
    if (expenses.length === 0) {
      alert('No expenses to export')
      return
    }

    // Helper function to escape CSV values (handle commas and quotes)
    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) return ''
      const stringValue = String(value)
      // If value contains comma, quote, or newline, wrap in quotes and escape quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    // CSV headers with user information
    const headers = [
      'User ID',
      'Description',
      'Amount',
      'Category',
      'Date',
      'Created At',
      'Updated At',
      'Expense ID'
    ]
    
    // Convert expenses to CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...expenses.map(expense => {
        const row = [
          escapeCsvValue(expense.userId || 'anonymous'),
          escapeCsvValue(expense.description || ''),
          escapeCsvValue(parseFloat(expense.amount || 0).toFixed(2)),
          escapeCsvValue(expense.category || ''),
          escapeCsvValue(expense.date || ''),
          escapeCsvValue(expense.createdAt || ''),
          escapeCsvValue(expense.updatedAt || ''),
          escapeCsvValue(expense.id || '')
        ]
        return row.join(',')
      })
    ]

    // Join all rows with newlines
    const csvContent = csvRows.join('\n')

    // Create and download the CSV file
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `master-expenses-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const filteredExpenses = expenses.filter(exp => {
    if (filter.category && exp.category !== filter.category) return false
    if (filter.userId && exp.userId !== filter.userId) return false
    return true
  })

  const categories = [...new Set(expenses.map(exp => exp.category))].filter(Boolean)
  const userIds = [...new Set(expenses.map(exp => exp.userId || 'anonymous'))].filter(Boolean)

  if (loading) {
    return (
      <div className="admin-portal">
        <div className="loading">Loading admin data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-portal">
        <header className="admin-header">
          <h1>🔐 Admin Portal</h1>
        </header>
        <div className="error-container">
          <div className="error-message-admin">{error}</div>
          <a href="/" className="back-link">← Back to Expense Tracker</a>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-portal">
      <header className="admin-header">
        <h1>🔐 Admin Portal - All Expenses</h1>
        <a href="/" className="back-link">← Back to Expense Tracker</a>
      </header>

      {stats && (
        <div className="admin-stats">
          <div className="stat-card">
            <h3>Total Expenses</h3>
            <p className="stat-value">{stats.totalExpenses}</p>
          </div>
          <div className="stat-card">
            <h3>Total Amount</h3>
            <p className="stat-value">${stats.totalAmount.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Average Expense</h3>
            <p className="stat-value">${stats.averageAmount.toFixed(2)}</p>
          </div>
        </div>
      )}

      <TributeLeaderboard expenses={expenses} users={users} />

      <div className="admin-filters">
        <select 
          value={filter.category} 
          onChange={(e) => setFilter({...filter, category: e.target.value})}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select 
          value={filter.userId} 
          onChange={(e) => setFilter({...filter, userId: e.target.value})}
          className="filter-select"
        >
          <option value="">All Users</option>
          {userIds.map(userId => (
            <option key={userId} value={userId}>{userId}</option>
          ))}
        </select>

        <button onClick={fetchData} className="refresh-btn" disabled={!token}>🔄 Refresh</button>
        <button onClick={handleExportMasterCSV} className="export-btn-admin" disabled={expenses.length === 0}>
          📥 Download Master CSV ({expenses.length} expenses)
        </button>
      </div>

      {stats && Object.keys(stats.byCategory).length > 0 && (
        <div className="category-breakdown">
          <h2>📊 Expenses by Category</h2>
          <div className="category-list">
            {Object.entries(stats.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([category, total]) => (
                <div key={category} className="category-item">
                  <span className="category-name">{category}</span>
                  <span className="category-amount">${total.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {stats && Object.keys(stats.byUser).length > 0 && (
        <div className="user-breakdown">
          <h2>👥 Expenses by User</h2>
          <div className="user-list">
            {Object.entries(stats.byUser)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([userId, data]) => (
                <div key={userId} className="user-item">
                  <span className="user-name">{userId}</span>
                  <span className="user-stats">
                    {data.count} expenses • ${data.total.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="admin-expenses">
        <h2>📋 All Expenses ({filteredExpenses.length})</h2>
        <div className="expenses-table-container">
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Date</th>
                <th>User ID</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-message">
                    No expenses found
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(expense => (
                  <tr key={expense.id}>
                    <td>{expense.description}</td>
                    <td className="amount-cell">${parseFloat(expense.amount).toFixed(2)}</td>
                    <td>
                      <span className="category-badge">{expense.category}</span>
                    </td>
                    <td>{expense.date}</td>
                    <td className="user-id-cell">{expense.userId || 'anonymous'}</td>
                    <td className="date-cell">{formatDate(expense.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminPortal

