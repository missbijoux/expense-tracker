const { Pool } = require('pg');

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  console.error('Please add a PostgreSQL database to your Railway project or set DATABASE_URL manually.');
  process.exit(1);
}

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('ssl') || process.env.DATABASE_URL?.includes('amazonaws') ? { rejectUnauthorized: false } : false,
});

// Handle connection errors
pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

// Initialize database schema
async function initDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "isAdmin" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create expenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(255) PRIMARY KEY,
        "userId" VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        category VARCHAR(255),
        date VARCHAR(255),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_userid ON expenses("userId")
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_created ON expenses("createdAt")
    `);

    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// User operations
async function getUserById(id) {
  const result = await pool.query('SELECT id, username, email, "isAdmin", "createdAt" FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

async function getUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

async function getUserByUsername(username) {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
}

async function createUser(user) {
  const { id, username, email, password, isAdmin } = user;
  await pool.query(
    'INSERT INTO users (id, username, email, password, "isAdmin") VALUES ($1, $2, $3, $4, $5)',
    [id, username, email, password, isAdmin || false]
  );
}

async function updateUser(id, updates) {
  // Only allow specific fields to be updated
  const allowedFields = ['username', 'email', 'isAdmin'];
  const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (fields.length === 0) {
    return;
  }
  
  const values = fields.map(field => updates[field]);
  const setClause = fields.map((field, i) => `"${field}" = $${i + 2}`).join(', ');
  
  await pool.query(
    `UPDATE users SET ${setClause} WHERE id = $1`,
    [id, ...values]
  );
}

async function getAllUsers() {
  const result = await pool.query('SELECT id, username, email, "isAdmin", "createdAt" FROM users ORDER BY "createdAt" DESC');
  return result.rows;
}

// Expense operations
async function getExpensesByUserId(userId) {
  const result = await pool.query(
    'SELECT * FROM expenses WHERE "userId" = $1 ORDER BY "createdAt" DESC',
    [userId]
  );
  return result.rows;
}

async function getAllExpenses() {
  const result = await pool.query('SELECT * FROM expenses ORDER BY "createdAt" DESC');
  return result.rows;
}

async function getExpenseById(id) {
  const result = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
  return result.rows[0];
}

async function createExpense(expense) {
  const { id, userId, description, amount, category, date } = expense;
  await pool.query(
    'INSERT INTO expenses (id, "userId", description, amount, category, date) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, userId, description, parseFloat(amount), category, date]
  );
  return await getExpenseById(id);
}

async function updateExpense(id, updates) {
  // Only allow specific fields to be updated
  const allowedFields = ['description', 'amount', 'category', 'date'];
  const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (fields.length === 0) {
    return await getExpenseById(id);
  }
  
  const values = fields.map(field => updates[field]);
  const setClause = fields.map((field, i) => `"${field}" = $${i + 2}`).join(', ');
  
  await pool.query(
    `UPDATE expenses SET ${setClause}, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1`,
    [id, ...values]
  );
  return await getExpenseById(id);
}

async function deleteExpense(id) {
  await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
}

module.exports = {
  pool,
  initDatabase,
  getUserById,
  getUserByEmail,
  getUserByUsername,
  createUser,
  updateUser,
  getAllUsers,
  getExpensesByUserId,
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};

