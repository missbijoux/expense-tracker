import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import ExpenseSummary from './components/ExpenseSummary'
import TributeLeaderboard from './components/TributeLeaderboard'
import './App.css'

function App({ user, token, onLogout }) {
  const [expenses, setExpenses] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [editingExpense, setEditingExpense] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Load expenses and leaderboard from API on mount
  useEffect(() => {
    if (token && user) {
      fetchExpenses()
      fetchLeaderboard()
    } else {
      setLoading(false)
    }
  }, [token, user])

  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses', {
        headers: getAuthHeaders()
      })
      
      if (response.status === 401 || response.status === 403) {
        // Token invalid, logout
        if (onLogout) onLogout()
        navigate('/login')
        return
      }

      const data = await response.json()
      setExpenses(data)
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard', {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Leaderboard data:', data) // Debug log
        setLeaderboard(data || [])
      } else {
        console.error('Leaderboard fetch failed:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error details:', errorData)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }

  // Create - Add new expense
  const handleAddExpense = async (expense) => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(expense)
      })

      if (response.status === 401 || response.status === 403) {
        if (onLogout) onLogout()
        navigate('/login')
        return
      }

      const savedExpense = await response.json()
      setExpenses([...expenses, savedExpense])
      
      // Refresh leaderboard after adding expense
      fetchLeaderboard()
    } catch (error) {
      console.error('Error saving expense:', error)
      alert('Error saving expense. Please try again.')
    }
  }

  // Update - Edit existing expense
  const handleUpdateExpense = async (updatedExpense) => {
    try {
      const response = await fetch(`/api/expenses/${updatedExpense.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedExpense)
      })

      if (response.status === 401 || response.status === 403) {
        if (onLogout) onLogout()
        navigate('/login')
        return
      }

      const savedExpense = await response.json()
      setExpenses(expenses.map(exp => 
        exp.id === savedExpense.id ? savedExpense : exp
      ))
      
      // Refresh leaderboard after updating expense
      fetchLeaderboard()
    } catch (error) {
      console.error('Error updating expense:', error)
      alert('Error updating expense. Please try again.')
    }
    setEditingExpense(null)
  }

  // Delete - Remove expense
  const handleDeleteExpense = async (id) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.status === 401 || response.status === 403) {
        if (onLogout) onLogout()
        navigate('/login')
        return
      }

      setExpenses(expenses.filter(exp => exp.id !== id))
      
      // Refresh leaderboard after deleting expense
      fetchLeaderboard()
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Error deleting expense. Please try again.')
    }
    if (editingExpense?.id === id) {
      setEditingExpense(null)
    }
  }

  // Start editing
  const handleEditExpense = (expense) => {
    setEditingExpense(expense)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingExpense(null)
  }

  // Calculate total
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)

  // Export expenses data as CSV
  const handleExportData = () => {
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

    // CSV headers
    const headers = ['Description', 'Amount', 'Category', 'Date', 'Created At', 'Updated At']
    
    // Convert expenses to CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...expenses.map(expense => {
        const row = [
          escapeCsvValue(expense.description),
          escapeCsvValue(parseFloat(expense.amount).toFixed(2)),
          escapeCsvValue(expense.category),
          escapeCsvValue(expense.date),
          escapeCsvValue(expense.createdAt || ''),
          escapeCsvValue(expense.updatedAt || '')
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
    link.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading expenses...</div>
      </div>
    )
  }

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    }
    navigate('/login')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Expense Tracker</h1>
        <p className="subtitle">Welcome, {user?.username || 'User'}!</p>
        <div className="header-actions">
          {(user?.isAdmin || user?.username === 'bijoux' || user?.email === 'bijouuu@ymail.com') && (
            <Link to="/admin" className="admin-link">🔐 Admin Portal</Link>
          )}
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="app-main">
        <div className="app-container">
          <ExpenseSummary total={totalExpenses} count={expenses.length} />

          <TributeLeaderboard leaderboardData={leaderboard} showTop={5} />
          
          <ExpenseForm 
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            editingExpense={editingExpense}
            onCancelEdit={handleCancelEdit}
          />

          <div className="export-section">
            <button onClick={handleExportData} className="export-btn">
              📥 Export All Expenses Data (CSV)
            </button>
          </div>

          <ExpenseList 
            expenses={expenses}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        </div>
      </main>
    </div>
  )
}

export default App
