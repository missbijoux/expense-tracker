import React, { useState, useEffect } from 'react'
import './ExpenseForm.css'

function ExpenseForm({ onAddExpense, onUpdateExpense, editingExpense, onCancelEdit }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        description: editingExpense.description || '',
        amount: editingExpense.amount || '',
        category: editingExpense.category || '',
        date: editingExpense.date || new Date().toISOString().split('T')[0]
      })
    } else {
      setFormData({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      })
    }
  }, [editingExpense])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.description.trim() || !formData.amount || !formData.category) {
      alert('Please fill in all fields')
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (editingExpense) {
      onUpdateExpense({
        ...editingExpense,
        ...formData,
        amount: amount
      })
    } else {
      onAddExpense({
        ...formData,
        amount: amount
      })
    }

    setFormData({
      description: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0]
    })
  }

  return (
    <div className="expense-form-container">
      <h2>{editingExpense ? '✏️ Edit Expense' : '➕ Add New Expense'}</h2>
      <form onSubmit={handleSubmit} className="expense-form">
        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g., Groceries, Gas, Dinner"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount ($) *</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            <option value="Food">Food</option>
            <option value="Transportation">Transportation</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="date">Date *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-actions">
          {editingExpense && (
            <button 
              type="button" 
              onClick={onCancelEdit}
              className="btn btn-cancel"
            >
              Cancel
            </button>
          )}
          <button type="submit" className="btn btn-submit">
            {editingExpense ? 'Update Expense' : 'Add Expense'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ExpenseForm
