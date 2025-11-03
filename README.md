# Expense Tracker

A beautiful, modern expense tracker built with React that provides full CRUD (Create, Read, Update, Delete) functionality.

## Features

- ✅ **Create**: Add new expenses with description, amount, category, and date
- ✅ **Read**: View all your expenses in a clean, organized list
- ✅ **Update**: Edit any existing expense
- ✅ **Delete**: Remove expenses you no longer need
- 📊 **Total Tracking**: See your total expenses, entry count, and average expense
- 💾 **Data Persistence**: Expenses are saved to PostgreSQL database
- 📥 **Data Export**: Export all your expenses as a CSV file for backup or analysis (opens in Excel, Google Sheets, etc.)

## Getting Started

### Prerequisites

- Node.js (>=18.0.0) and npm (>=9.0.0)
- PostgreSQL database (local or hosted, e.g., Railway, Supabase, or local PostgreSQL)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Create a `.env` file or set environment variables:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   JWT_SECRET=your-secret-key-here
   ADMIN_EMAILS=your-email@example.com
   PORT=3000
   ```
   - On Railway, add these as environment variables in your project settings

3. For development, you have two options:

   **Option A: Run both frontend and backend** (recommended for development)
   ```bash
   # Terminal 1: Start the backend server
   npm run dev:server
   
   # Terminal 2: Start the frontend dev server
   npm run dev
   ```
   Then open `http://localhost:5173` (Vite dev server with hot reload)

   **Option B: Run production build** (simulates production)
   ```bash
   npm run build
   npm start
   ```
   Then open `http://localhost:3000`

## Usage

1. **Add an Expense**: Fill out the form with:
   - Description (e.g., "Groceries", "Gas", "Dinner")
   - Amount (in dollars)
   - Category (Food, Transportation, Shopping, Bills, Entertainment, Healthcare, or Other)
   - Date

2. **Edit an Expense**: Click the "Edit" button on any expense, make your changes, and click "Update Expense"

3. **Delete an Expense**: Click the "Delete" button on any expense and confirm the deletion

4. **Export Data**: Click the "Export All Expenses Data (CSV)" button to download a CSV file containing all your expenses. The file can be opened in Excel, Google Sheets, or any spreadsheet application.

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
- React Router (client-side routing)
- Vite (build tool)
- Express.js (backend API server)
- PostgreSQL (database)
- CSS3 (modern styling with gradients and animations)
- `pg` (PostgreSQL client for Node.js)
- localStorage (client-side caching)

## Project Structure

```
expense-tracker/
├── src/
│   ├── components/
│   │   ├── ExpenseForm.jsx      # Form for adding/editing expenses
│   │   ├── ExpenseList.jsx       # List view of all expenses
│   │   ├── ExpenseSummary.jsx   # Summary cards showing totals
│   │   └── *.css                 # Component-specific styles
│   ├── pages/
│   │   ├── AdminPortal.jsx      # Admin portal to view all expenses
│   │   └── AdminPortal.css      # Admin portal styles
│   ├── App.jsx                   # Main application component
│   ├── App.css                   # Main app styles
│   ├── main.jsx                  # Application entry point
│   └── index.css                 # Global styles
├── db.js                         # PostgreSQL database layer
├── server.js                     # Express backend server
├── index.html                    # HTML entry point
├── package.json                  # Dependencies and scripts
├── vite.config.js               # Vite configuration
└── railway.json                  # Railway deployment config
```

## Admin Portal

Access the admin portal to view **all expenses from all users**:
- Navigate to `/admin` or click the "🔐 Admin Portal" link in the header
- View statistics: total expenses, amounts, averages
- Filter by category or user
- See breakdown by category and by user
- View all expenses in a sortable table

The admin portal provides comprehensive insights into all user activity across the platform.

## Data Access

Expense data is stored in PostgreSQL database:
1. **Database**: All expenses and users are stored in PostgreSQL (persistent and reliable)
2. **Client-side**: Each user's expenses are cached in localStorage for offline access

To access your data:
- **CSV Export**: Use the "Export All Expenses Data (CSV)" button in the app
- **Admin Portal**: View all user expenses at `/admin`
- **API**: Access expenses via REST API endpoints (see server.js)

## Database Setup

### On Railway

1. Add a PostgreSQL service to your Railway project
2. Railway will automatically provide a `DATABASE_URL` environment variable
3. The app will automatically create the necessary tables on startup

### Local Development

1. Install PostgreSQL locally or use a cloud service (Supabase, Neon, etc.)
2. Set the `DATABASE_URL` environment variable:
   ```bash
   export DATABASE_URL=postgresql://user:password@localhost:5432/expense_tracker
   ```
3. Run `npm run dev:server` - the database schema will be created automatically

## Future Enhancements

Potential features you could add:
- Expense filtering and search
- Category-based statistics and charts
- Date range filtering
- Multiple currencies
- Expense recurrence/rules
- Backend integration for cloud storage
