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
    console.log('Connected to SQLite database for settings');
    // Create settings table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default',
      theme TEXT DEFAULT 'light',
      language TEXT DEFAULT 'en',
      notifications BOOLEAN DEFAULT 1,
      default_view TEXT DEFAULT 'tasks',
      date_format TEXT DEFAULT 'MM/DD/YYYY',
      time_format TEXT DEFAULT '12h',
      start_day_of_week INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating settings table:', err.message);
      } else {
        // Insert default settings if they don't exist
        db.get('SELECT * FROM settings WHERE user_id = ?', ['default'], (err, row) => {
          if (err) {
            console.error('Error checking for default settings:', err.message);
          } else if (!row) {
            db.run('INSERT INTO settings (user_id) VALUES (?)', ['default'], (err) => {
              if (err) {
                console.error('Error inserting default settings:', err.message);
              } else {
                console.log('Default settings created');
              }
            });
          }
        });
      }
    });
  }
});

// Get settings (currently only supporting default user)
router.get('/', (req, res) => {
  console.log('GET /settings route called');
  db.get('SELECT * FROM settings WHERE user_id = ?', ['default'], (err, row) => {
    if (err) {
      console.error('Error fetching settings:', err);
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
    
    if (!row) {
      console.log('No settings found, creating default settings');
      // Create default settings if none exist
      const defaultSettings = {
        user_id: 'default',
        theme: 'light',
        language: 'en',
        notifications: 1,
        default_view: 'tasks',
        date_format: 'MM/DD/YYYY',
        time_format: '12h',
        start_day_of_week: 0
      };
      
      db.run('INSERT INTO settings (user_id, theme, language, notifications, default_view, date_format, time_format, start_day_of_week) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [defaultSettings.user_id, defaultSettings.theme, defaultSettings.language, defaultSettings.notifications, 
         defaultSettings.default_view, defaultSettings.date_format, defaultSettings.time_format, defaultSettings.start_day_of_week],
        function(err) {
          if (err) {
            console.error('Error creating default settings:', err);
            return res.status(500).json({ error: 'Server error', details: err.message });
          }
          res.json(defaultSettings);
        });
    } else {
      res.json(row);
    }
  });
});

// Update settings
router.put('/', (req, res) => {
  const { theme, language, notifications, default_view, date_format, time_format, start_day_of_week } = req.body;
  
  console.log('Received settings update:', req.body);
  
  // Check if settings exist
  db.get('SELECT * FROM settings WHERE user_id = ?', ['default'], (err, row) => {
    if (err) {
      console.error('Error checking settings existence:', err);
      return res.status(500).json({ error: 'Server error' });
    }
    
    console.log('Current settings in DB:', row);
    
    if (!row) {
      // Create settings if they don't exist
      const sql = 'INSERT INTO settings (user_id, theme, language, notifications, default_view, date_format, time_format, start_day_of_week) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      db.run(sql, ['default', theme, language, notifications ? 1 : 0, default_view, date_format, time_format, start_day_of_week], function(err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Server error' });
        }
        
        db.get('SELECT * FROM settings WHERE id = ?', [this.lastID], (err, newRow) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
          }
          res.json(newRow);
        });
      });
    } else {
      // Update existing settings
      const sql = `UPDATE settings SET 
        theme = COALESCE(?, theme), 
        language = COALESCE(?, language), 
        notifications = COALESCE(?, notifications), 
        default_view = COALESCE(?, default_view), 
        date_format = COALESCE(?, date_format), 
        time_format = COALESCE(?, time_format), 
        start_day_of_week = COALESCE(?, start_day_of_week),
        updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = ?`;
      
      db.run(sql, [theme, language, notifications !== undefined ? (notifications ? 1 : 0) : null, default_view, date_format, time_format, start_day_of_week, 'default'], function(err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Server error' });
        }
        
        // After update, log the updated settings
        db.get('SELECT * FROM settings WHERE user_id = ?', ['default'], (err, updatedRow) => {
          if (err) {
            console.error('Error fetching updated settings:', err);
            return res.status(500).json({ error: 'Server error' });
          }
          console.log('Updated settings in DB:', updatedRow);
          res.json(updatedRow);
        });
      });
    }
  });
});

module.exports = router;