const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').filter(email => email.trim());

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React app
app.use(express.static(path.join(__dirname, 'dist')));

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

// Admin authentication middleware
async function authenticateAdmin(req, res, next) {
  try {
    // First verify token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decodedUser) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token.' });
      }

      // Check if user is admin
      const user = await db.getUserById(decodedUser.id);
      
      // Check if user is admin (either has isAdmin flag OR email is in ADMIN_EMAILS)
      const isAdmin = user?.isAdmin === true || 
                      (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(decodedUser.email));
      
      if (!isAdmin) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }
      
      req.user = decodedUser;
      next();
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

    // Check if user already exists
    const existingUserByEmail = await db.getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const existingUserByUsername = await db.getUserByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      isAdmin: ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(email)
    };

    await db.createUser(newUser);

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
        email: newUser.email,
        isAdmin: newUser.isAdmin || false
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
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

    const user = await db.getUserByEmail(email);

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

    // Check if user is admin
    const isAdmin = user.isAdmin === true || 
                    (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(user.email));

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: isAdmin || false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
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
    const expenses = await db.getExpensesByUserId(req.user.id);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new expense (protected)
app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const expense = {
      id: Date.now().toString(),
      userId: req.user.id,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    const savedExpense = await db.createExpense(expense);
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update expense (protected)
app.put('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const expense = await db.getExpenseById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Check if expense belongs to user
    if (expense.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own expenses' });
    }
    
    const updatedExpense = await db.updateExpense(req.params.id, req.body);
    res.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete expense (protected)
app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const expense = await db.getExpenseById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Check if expense belongs to user
    if (expense.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own expenses' });
    }
    
    await db.deleteExpense(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin portal - Get all users (admin only)
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin portal - Get all expenses (admin only - returns ALL expenses from ALL users)
app.get('/api/admin/expenses', authenticateAdmin, async (req, res) => {
  try {
    const expenses = await db.getAllExpenses();
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching all expenses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public leaderboard - Get top contributors (for logged in users)
app.get('/api/leaderboard', authenticateToken, async (req, res) => {
  try {
    console.log('=== Leaderboard API Called ===');
    console.log('Requesting user ID:', req.user.id);
    
    const expenses = await db.getAllExpenses();
    console.log('Total expenses for leaderboard:', expenses.length);
    
    const users = await db.getAllUsers();
    console.log('Users data:', users.length, 'users found');
    
    // Calculate user stats
    const userStats = {};
    
    expenses.forEach(expense => {
      const userId = expense.userId || 'anonymous';
      const amount = parseFloat(expense.amount || 0);
      
      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          count: 0,
          totalAmount: 0
        };
      }
      userStats[userId].count++;
      userStats[userId].totalAmount += amount;
    });

    console.log('User stats calculated:', Object.keys(userStats).length, 'users');

    // Add user details and sort by total amount
    const leaderboard = Object.values(userStats)
      .map(stat => {
        // Try to find user by matching IDs (handling string/number mismatches)
        const user = users.find(u => 
          String(u.id) === String(stat.userId) || 
          u.id === stat.userId
        );
        
        return {
          userId: stat.userId,
          username: user?.username || `User ${String(stat.userId).slice(-6)}`,
          count: stat.count,
          totalAmount: stat.totalAmount
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5); // Top 5 only
    
    console.log('Final leaderboard result:', leaderboard.length, 'entries');
    console.log('Final leaderboard data:', JSON.stringify(leaderboard, null, 2));
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin portal - Get all expenses with stats (admin only)
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const expenses = await db.getAllExpenses();
    
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
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Catch all handler: send back React's index.html file for client-side routing
// This should be last, after all API routes
app.get('*', (req, res) => {
  // Don't catch API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize database and start server
async function startServer() {
  try {
    await db.initDatabase();
    console.log('✅ Database initialized');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Admin portal: http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
