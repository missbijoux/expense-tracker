import React from 'react'
import './ExpenseList.css'

function ExpenseList({ expenses, onEditExpense, onDeleteExpense }) {
  if (expenses.length === 0) {
    return (
      <div className="expense-list-container">
        <h2>📋 Your Expenses</h2>
        <div className="empty-state">
          <p>No expenses yet. Add your first expense above! 🎉</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getCategoryIcon = (category) => {
    const icons = {
      Food: '🍔',
      Transportation: '🚗',
      Shopping: '🛍️',
      Bills: '💳',
      Entertainment: '🎬',
      Healthcare: '🏥',
      Other: '📦'
    }
    return icons[category] || '📦'
  }

  return (
    <div className="expense-list-container">
      <h2>📋 Your Expenses ({expenses.length})</h2>
      <div className="expense-list">
        {expenses.map(expense => (
          <div key={expense.id} className="expense-item">
            <div className="expense-info">
              <div className="expense-header">
                <span className="category-badge">
                  {getCategoryIcon(expense.category)} {expense.category}
                </span>
                <span className="expense-amount">
                  ${parseFloat(expense.amount).toFixed(2)}
                </span>
              </div>
              <div className="expense-details">
                <p className="expense-description">{expense.description}</p>
                <p className="expense-date">{formatDate(expense.date)}</p>
              </div>
            </div>
            <div className="expense-actions">
              <button
                onClick={() => onEditExpense(expense)}
                className="btn-action btn-edit"
                title="Edit expense"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this expense?')) {
                    onDeleteExpense(expense.id)
                  }
                }}
                className="btn-action btn-delete"
                title="Delete expense"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ExpenseList
