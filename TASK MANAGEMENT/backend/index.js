const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// SQLite database connection
const dbPath = path.resolve(__dirname, './database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite Database connection error:');
    console.error(`🔍 Error details: ${err.message}`);
    console.error('⚠️ Please check if the database file is accessible');
  } else {
    console.log('✅ SQLite Database connected successfully!');
    console.log(`📊 Connected to: ${dbPath}`);
    
    // Create tasks table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      completed INTEGER DEFAULT 0,
      recurrence_rule TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating tasks table:', err.message);
      } else {
        console.log('Tasks table created or already exists');
      }
    });
  }
});

// Routes
// Add this before your routes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Then your existing routes
app.use('/tasks', require('./routes/tasks'));
app.use('/settings', require('./routes/settings')); // Add this line

// Add this after your routes to catch 404 errors
app.use((req, res, next) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).send('Not Found');
});

// Default route
app.get('/', (req, res) => {
  res.send('Task Management API');
});

// Test database connection endpoint
app.get('/test-db', (req, res) => {
  db.get("SELECT DATETIME('now') as now", (err, row) => {
    if (err) {
      console.error('Database connection error:', err.message);
      res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: err.message
      });
    } else {
      res.json({
        success: true,
        message: 'Database connection successful',
        timestamp: row.now
      });
    }
  });
});

// New route to display tasks in HTML table format
app.get('/table-view', (req, res) => {
  db.all('SELECT * FROM tasks ORDER BY due_date ASC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching tasks:', err.message);
      return res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
    }
    
    // Generate HTML table
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tasks Database</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
          }
          h1 {
            color: #6366f1;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background-color: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background-color: #6366f1;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          tr:hover {
            background-color: #f0f1fe;
          }
          .completed {
            background-color: #dcfce7;
          }
          .completed td:first-child {
            text-decoration: line-through;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .badge-completed {
            background-color: #22c55e;
            color: white;
          }
          .badge-pending {
            background-color: #6366f1;
            color: white;
          }
          .timestamp {
            font-size: 12px;
            color: #6c757d;
            margin-bottom: 20px;
          }
          .description {
            max-width: 300px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        </style>
      </head>
      <body>
        <h1>Tasks Database</h1>
        <p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Recurrence</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    if (rows.length === 0) {
      html += `
        <tr>
          <td colspan="6" style="text-align: center;">No tasks found</td>
        </tr>
      `;
    } else {
      rows.forEach(task => {
        // Parse recurrence rule if exists
        let recurrenceText = 'None';
        if (task.recurrence_rule) {
          try {
            const rule = JSON.parse(task.recurrence_rule);
            recurrenceText = `${rule.frequency} (every ${rule.interval} ${rule.interval === 1 ? rule.frequency.slice(0, -2) : rule.frequency})`;
          } catch (e) {
            recurrenceText = 'Invalid format';
          }
        }
        
        // Format due date
        const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set';
        
        html += `
          <tr class="${task.completed ? 'completed' : ''}">
            <td>${task.id}</td>
            <td>${task.title}</td>
            <td class="description">${task.description || 'No description'}</td>
            <td>${dueDate}</td>
            <td>
              <span class="badge ${task.completed ? 'badge-completed' : 'badge-pending'}">
                ${task.completed ? 'Completed' : 'Pending'}
              </span>
            </td>
            <td>${recurrenceText}</td>
          </tr>
        `;
      });
    }
    
    html += `
          </tbody>
        </table>
        <p>Total tasks: ${rows.length}</p>
      </body>
      </html>
    `;
    
    res.send(html);
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});