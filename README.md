# Expense Tracker

A beautiful, modern expense tracker built with React that provides full CRUD (Create, Read, Update, Delete) functionality.

## Features

- ✅ **Create**: Add new expenses with description, amount, category, and date
- ✅ **Read**: View all your expenses in a clean, organized list
- ✅ **Update**: Edit any existing expense
- ✅ **Delete**: Remove expenses you no longer need
- 📊 **Total Tracking**: See your total expenses, entry count, and average expense
- 💾 **Data Persistence**: Expenses are automatically saved to localStorage
- 📥 **Data Export**: Export all your expenses as a JSON file for backup or analysis

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## Usage

1. **Add an Expense**: Fill out the form with:
   - Description (e.g., "Groceries", "Gas", "Dinner")
   - Amount (in dollars)
   - Category (Food, Transportation, Shopping, Bills, Entertainment, Healthcare, or Other)
   - Date

2. **Edit an Expense**: Click the "Edit" button on any expense, make your changes, and click "Update Expense"

3. **Delete an Expense**: Click the "Delete" button on any expense and confirm the deletion

4. **Export Data**: Click the "Export All Expenses Data (JSON)" button to download a JSON file containing all your expenses

## Deployment

### Deploy to Railway

1. Push your code to GitHub
2. Connect your GitHub repository to Railway
3. Railway will automatically detect the Vite project and run:
   - Build command: `npm run build`
   - Start command: `npm run start`
4. Your app will be live at a Railway-provided URL

The `railway.json` configuration file is included for optimal deployment settings.

## Technology Stack

- React 18
- Vite (build tool)
- CSS3 (modern styling with gradients and animations)
- localStorage (data persistence)
- serve (static file server for production)

## Project Structure

```
expense-tracker/
├── src/
│   ├── components/
│   │   ├── ExpenseForm.jsx      # Form for adding/editing expenses
│   │   ├── ExpenseList.jsx       # List view of all expenses
│   │   ├── ExpenseSummary.jsx   # Summary cards showing totals
│   │   └── *.css                 # Component-specific styles
│   ├── App.jsx                   # Main application component
│   ├── App.css                   # Main app styles
│   ├── main.jsx                  # Application entry point
│   └── index.css                 # Global styles
├── index.html                    # HTML entry point
├── package.json                  # Dependencies and scripts
└── vite.config.js               # Vite configuration
```

## Data Access

All expense data is stored in your browser's localStorage. To access the raw data:

1. Use the "Export All Expenses Data (JSON)" button in the app
2. Open browser DevTools (F12) → Application/Storage → Local Storage → Check the `expenses` key

## Future Enhancements

Potential features you could add:
- Expense filtering and search
- Category-based statistics and charts
- Date range filtering
- Multiple currencies
- Expense recurrence/rules
- Backend integration for cloud storage
