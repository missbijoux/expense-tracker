const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const DATA_FILE = path.join(__dirname, 'data', 'expenses.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React app
app.use(express.static(path.join(__dirname, 'dist')));

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify({ expenses: [] }, null, 2));
    await fs.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}

// Read users data
async function readUsers() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [] };
  }
}

// Write users data
async function writeUsers(data) {
  await ensureDataDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token.' });
    }
    req.user = user;
    next();
  });
}

// Read expenses data
async function readExpenses() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { expenses: [], users: {} };
  }
}

// Write expenses data
async function writeExpenses(data) {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// API Routes - Authentication

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const usersData = await readUsers();
    
    // Check if user already exists
    if (usersData.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    if (usersData.users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    usersData.users.push(newUser);
    await writeUsers(usersData);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const usersData = await readUsers();
    const user = usersData.users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Protected API Routes - Expenses

// Get all expenses for authenticated user
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const data = await readExpenses();
    const userExpenses = data.expenses.filter(exp => exp.userId === req.user.id);
    res.json(userExpenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new expense (protected)
app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const data = await readExpenses();
    const expense = {
      ...req.body,
      userId: req.user.id,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    data.expenses.push(expense);
    await writeExpenses(data);
    
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update expense (protected)
app.put('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const data = await readExpenses();
    const index = data.expenses.findIndex(exp => exp.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Check if expense belongs to user
    if (data.expenses[index].userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own expenses' });
    }
    
    data.expenses[index] = {
      ...data.expenses[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await writeExpenses(data);
    res.json(data.expenses[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete expense (protected)
app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const data = await readExpenses();
    const index = data.expenses.findIndex(exp => exp.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Check if expense belongs to user
    if (data.expenses[index].userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own expenses' });
    }
    
    data.expenses.splice(index, 1);
    await writeExpenses(data);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin portal - Get all expenses with stats (protected)
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    const data = await readExpenses();
    const expenses = data.expenses;
    
    const stats = {
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0),
      averageAmount: expenses.length > 0 
        ? expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0) / expenses.length 
        : 0,
      byCategory: {},
      byUser: {},
      recentExpenses: expenses
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 50)
    };
    
    // Calculate by category
    expenses.forEach(exp => {
      const cat = exp.category || 'Other';
      stats.byCategory[cat] = (stats.byCategory[cat] || 0) + parseFloat(exp.amount || 0);
    });
    
    // Calculate by user
    expenses.forEach(exp => {
      const userId = exp.userId || 'anonymous';
      if (!stats.byUser[userId]) {
        stats.byUser[userId] = { count: 0, total: 0 };
      }
      stats.byUser[userId].count++;
      stats.byUser[userId].total += parseFloat(exp.amount || 0);
    });
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize data file on startup
ensureDataDir().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Admin portal: http://localhost:${PORT}/admin`);
  });
});

