import React from 'react'
import './ExpenseSummary.css'

function ExpenseSummary({ total, count }) {
  return (
    <div className="expense-summary">
      <div className="summary-card">
        <div className="summary-icon">📊</div>
        <div className="summary-content">
          <h3>Total Expenses</h3>
          <p className="summary-amount">${total.toFixed(2)}</p>
        </div>
      </div>
      <div className="summary-card">
        <div className="summary-icon">📝</div>
        <div className="summary-content">
          <h3>Total Entries</h3>
          <p className="summary-count">{count}</p>
        </div>
      </div>
      {count > 0 && (
        <div className="summary-card">
          <div className="summary-icon">📈</div>
          <div className="summary-content">
            <h3>Average Expense</h3>
            <p className="summary-average">${(total / count).toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpenseSummary
