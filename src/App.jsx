import React, { useState, useEffect } from 'react'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import ExpenseSummary from './components/ExpenseSummary'
import './App.css'

function App() {
  const [expenses, setExpenses] = useState(() => {
    // Load expenses from localStorage if available
    const savedExpenses = localStorage.getItem('expenses')
    return savedExpenses ? JSON.parse(savedExpenses) : []
  })
  const [editingExpense, setEditingExpense] = useState(null)

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses))
  }, [expenses])

  // Create - Add new expense
  const handleAddExpense = (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setExpenses([...expenses, newExpense])
  }

  // Update - Edit existing expense
  const handleUpdateExpense = (updatedExpense) => {
    setExpenses(expenses.map(exp => 
      exp.id === updatedExpense.id 
        ? { ...updatedExpense, updatedAt: new Date().toISOString() }
        : exp
    ))
    setEditingExpense(null)
  }

  // Delete - Remove expense
  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id))
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Expense Tracker</h1>
        <p className="subtitle">Track your expenses with ease</p>
      </header>

      <main className="app-main">
        <div className="app-container">
          <ExpenseSummary total={totalExpenses} count={expenses.length} />
          
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
