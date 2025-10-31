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

  // Export expenses data
  const handleExportData = () => {
    const dataStr = JSON.stringify(expenses, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `expenses-${new Date().toISOString().split('T')[0]}.json`
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
              📥 Export All Expenses Data (JSON)
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
