const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    // Create tasks table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      completed INTEGER DEFAULT 0,
      recurrence_rule TEXT
    )`);
  }
});

// Get all tasks
router.get('/', (req, res) => {
  db.all('SELECT * FROM tasks ORDER BY due_date ASC', [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(rows);
  });
});

// Get a specific task
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(row);
  });
});

// Create a new task
router.post('/', (req, res) => {
  const { title, description, due_date, recurrence_rule } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const sql = 'INSERT INTO tasks (title, description, due_date, recurrence_rule) VALUES (?, ?, ?, ?)';
  db.run(sql, [title, description, due_date, recurrence_rule], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    
    db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.status(201).json(row);
    });
  });
});

// Update a task
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, completed, recurrence_rule } = req.body;
  
  // Check if task exists
  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const sql = 'UPDATE tasks SET title = ?, description = ?, due_date = ?, completed = ?, recurrence_rule = ? WHERE id = ?';
    db.run(sql, [title, description, due_date, completed ? 1 : 0, recurrence_rule, id], function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      
      db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, updatedRow) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Server error' });
        }
        res.json(updatedRow);
      });
    });
  });
});

// Delete a task
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Check if task exists
  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.json({ message: 'Task deleted successfully' });
    });
  });
});

module.exports = router;