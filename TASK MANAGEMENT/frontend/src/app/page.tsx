'use client';

import { useState, useEffect } from 'react';
import TaskList from '../components/TaskList';
import RecurrenceForm from '../components/RecurrenceForm';
import MiniCalendar from '../components/MiniCalendar';
import DatePicker from '../components/DatePicker';
import { 
  addDays, addWeeks, addMonths, addYears, parseISO, 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  isSameDay, isSameMonth 
} from 'date-fns';

import SettingsComponent from '../components/Settings';

interface Task {
  id?: number;
  title: string;
  description?: string;
  due_date?: string;
  completed?: boolean;
  recurrence_rule?: string;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<Task>({
    title: '',
    description: '',
    due_date: '',
  });
  const [recurrenceRule, setRecurrenceRule] = useState(null);
  const [recurrenceDates, setRecurrenceDates] = useState<Date[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Add state for active tab
  const [activeTab, setActiveTab] = useState('tasks');
  // Add state for selected date and tasks for that date
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateTasks, setSelectedDateTasks] = useState<Task[]>([]);
  
  // Add function to handle day click in the calendar
  const handleCalendarDayClick = (date: Date, tasks: Task[]) => {
    setSelectedDate(date);
    setSelectedDateTasks(tasks);
    handleTabChange('tasks'); // Switch to tasks tab to show the tasks for the selected date
  };
  
  // Move the generateCalendarDays function inside the component
  const generateCalendarDays = () => {
    const currentDate = selectedDate || new Date();
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const days = [];
    let day = startDate;
    
    while (day <= endDate) {
      days.push({
        date: day,
        currentMonth: isSameMonth(day, monthStart)
      });
      day = addDays(day, 1);
    }
    
    return days;
  };
  
  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('http://localhost:5000/tasks');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        setTasks(data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Generate preview dates for recurrence
  useEffect(() => {
    if (!recurrenceRule || !newTask.due_date) {
      setRecurrenceDates([]);
      return;
    }

    const startDate = parseISO(newTask.due_date);
    const dates = [startDate];
    const { frequency, interval } = recurrenceRule;
    
    // Generate next 10 occurrences for preview
    for (let i = 1; i <= 10; i++) {
      let nextDate;
      
      switch (frequency) {
        case 'daily':
          nextDate = addDays(startDate, i * interval);
          break;
        case 'weekly':
          nextDate = addWeeks(startDate, i * interval);
          break;
        case 'monthly':
          nextDate = addMonths(startDate, i * interval);
          break;
        case 'yearly':
          nextDate = addYears(startDate, i * interval);
          break;
        default:
          continue;
      }
      
      dates.push(nextDate);
    }
    
    setRecurrenceDates(dates);
  }, [recurrenceRule, newTask.due_date]);

  // Add function to handle tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTask.title.trim()) {
      setError('Task title is required');
      return;
    }
    
    try {
      const taskToAdd = {
        ...newTask,
        recurrence_rule: recurrenceRule ? JSON.stringify(recurrenceRule) : null
      };
      
      const response = await fetch('http://localhost:5000/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskToAdd),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add task');
      }
      
      const addedTask = await response.json();
      setTasks(prev => [...prev, addedTask]);
      setNewTask({
        title: '',
        description: '',
        due_date: '',
      });
      setRecurrenceRule(null);
      setError('');
    } catch (err) {
      console.error('Error adding task:', err);
      setError('Failed to add task. Please try again.');
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5000/tasks/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  const handleToggleComplete = async (id: number, completed: boolean) => {
    try {
      const taskToUpdate = tasks.find(task => task.id === id);
      if (!taskToUpdate) return;
      
      const response = await fetch(`http://localhost:5000/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...taskToUpdate, completed }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      
      const updatedTask = await response.json();
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task. Please try again.');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date || '',
    });
    setRecurrenceRule(task.recurrence_rule ? JSON.parse(task.recurrence_rule) : null);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTask || !editingTask.id) return;
    if (!newTask.title.trim()) {
      setError('Task title is required');
      return;
    }
    
    try {
      const taskToUpdate = {
        ...newTask,
        recurrence_rule: recurrenceRule ? JSON.stringify(recurrenceRule) : null
      };
      
      const response = await fetch(`http://localhost:5000/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskToUpdate,
          completed: editingTask.completed,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      
      const updatedTask = await response.json();
      setTasks(prev => prev.map(task => 
        task.id === editingTask.id ? updatedTask : task
      ));
      
      setNewTask({
        title: '',
        description: '',
        due_date: '',
      });
      setRecurrenceRule(null);
      setError('');
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task. Please try again.');
    }
  };
  
  return (
    <div className="container">
      <header className="app-header">
        <title>Task Management</title>
        <h1 className="app-title">✓ Task Management</h1>
        <nav className="navbar">
          <ul className="nav-links">
            <li>
              <a 
                href="#" 
                className={`nav-link ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleTabChange('tasks');
                }}
              >
                Tasks
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={`nav-link ${activeTab === 'calendar' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleTabChange('calendar');
                }}
              >
                Calendar
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={`nav-link ${activeTab === 'statistics' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleTabChange('statistics');
                }}
              >
                Statistics
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleTabChange('settings');
                }}
              >
                Settings
              </a>
            </li>
          </ul>
        </nav>
        
        {/* Remove the NavbarCalendar component and its container */}
      </header>
      
      {error && <div className="error-message card">{error}</div>}
      
      {/* Conditional rendering based on active tab */}
      {activeTab === 'tasks' && (
        <div className="app-layout">
          <section className="task-form-section card">
            <h2 className="section-title">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
            <form onSubmit={editingTask ? handleUpdateTask : handleAddTask}>
              <div className="form-group">
                <label htmlFor="title" className="form-label">Task Title</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newTask.title}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                    placeholder="Enter task title"
                  />
                  <span className="input-icon">📝</span>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="description" className="form-label">Description</label>
                <div className="input-with-icon">
                  <textarea
                    id="description"
                    name="description"
                    value={newTask.description}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Add details about your task"
                    rows={3}
                  />
                  <span className="input-icon textarea-icon">📄</span>
                </div>
              </div>
              
              <div className="form-group">
                <DatePicker
                  value={newTask.due_date}
                  onChange={(date: string) => setNewTask(prev => ({ ...prev, due_date: date }))}
                  label="Due Date"
                />
              </div>
              
              <div className="recurrence-section card-inner">
                <h3 className="subsection-title">Recurrence</h3>
                <RecurrenceForm
                  initialValue={recurrenceRule}
                  onChange={setRecurrenceRule}
                />
              </div>
              
              {recurrenceDates.length > 0 && (
                <div className="recurrence-preview card-inner">
                  <h3 className="subsection-title">Recurrence Preview</h3>
                  <MiniCalendar dates={recurrenceDates} />
                </div>
              )}
              
              <div className="form-actions">
                <button type="submit" className="btn-primary btn-with-icon">
                  <span className="btn-icon">{editingTask ? '✏️' : '➕'}</span>
                  <span>{editingTask ? 'Update Task' : 'Add Task'}</span>
                </button>
                
                {editingTask && (
                  <button
                    type="button"
                    className="btn-secondary btn-with-icon"
                    onClick={() => {
                      setEditingTask(null);
                      setNewTask({
                        title: '',
                        description: '',
                        due_date: '',
                      });
                      setRecurrenceRule(null);
                    }}
                  >
                    <span className="btn-icon">❌</span>
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </form>
          </section>
          
          <section className="tasks-section card">
            <h2 className="section-title">Your Tasks</h2>
            {loading ? (
              <div className="loading-spinner">
                <p>Loading tasks...</p>
              </div>
            ) : tasks.length > 0 ? (
              <TaskList
                tasks={tasks}
                onDelete={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditTask}
              />
            ) : (
              <div className="empty-state">
                <p>No tasks yet. Add your first task!</p>
              </div>
            )}
          </section>
        </div>
      )}
      
      {activeTab === 'calendar' && (
        <div className="app-layout">
          <section className="calendar-section card">
            <h2 className="section-title">Calendar View</h2>
            <div className="full-calendar-container">
              <div className="calendar-controls">
                <button 
                  className="btn-secondary" 
                  onClick={() => {
                    const newDate = new Date(selectedDate || new Date());
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedDate(newDate);
                  }}
                >
                  Previous Month
                </button>
                <h3 className="calendar-current-month">
                  {selectedDate ? format(selectedDate, 'MMMM yyyy') : format(new Date(), 'MMMM yyyy')}
                </h3>
                <button 
                  className="btn-secondary" 
                  onClick={() => {
                    const newDate = new Date(selectedDate || new Date());
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedDate(newDate);
                  }}
                >
                  Next Month
                </button>
              </div>
              
              <div className="calendar-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="calendar-weekday">{day}</div>
                ))}
              </div>
              
              <div className="calendar-days">
                {generateCalendarDays().map((day, index) => {
                  const dayTasks = tasks.filter(task => {
                    if (!task.due_date) return false;
                    return isSameDay(parseISO(task.due_date), day.date);
                  });
                  
                  const hasCompletedTasks = dayTasks.some(task => task.completed);
                  const hasPendingTasks = dayTasks.some(task => !task.completed);
                  
                  let dayClass = 'calendar-day';
                  if (!day.currentMonth) dayClass += ' other-month';
                  if (isSameDay(day.date, new Date())) dayClass += ' today';
                  if (selectedDate && isSameDay(day.date, selectedDate)) dayClass += ' selected';
                  if (hasPendingTasks) dayClass += ' has-pending-tasks';
                  else if (hasCompletedTasks) dayClass += ' all-completed-tasks';
                  
                  return (
                    <div 
                      key={index} 
                      className={dayClass}
                      onClick={() => {
                        setSelectedDate(day.date);
                        setSelectedDateTasks(dayTasks);
                      }}
                    >
                      <span className="calendar-day-number">{format(day.date, 'd')}</span>
                      {dayTasks.length > 0 && (
                        <span className="calendar-day-task-count">{dayTasks.length}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {selectedDate && (
              <div className="selected-day-tasks">
                <h3 className="subsection-title">
                  Tasks for {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                {selectedDateTasks.length > 0 ? (
                  <TaskList
                    tasks={selectedDateTasks}
                    onDelete={handleDeleteTask}
                    onToggleComplete={handleToggleComplete}
                    onEdit={handleEditTask}
                  />
                ) : (
                  <p className="no-tasks-message">No tasks for this day</p>
                )}
              </div>
            )}
          </section>
        </div>
      )}
      
      {activeTab === 'statistics' && (
        <div className="app-layout">
          <section className="statistics-section card">
            <h2 className="section-title">Task Statistics</h2>
            {loading ? (
              <div className="loading-spinner">Loading statistics...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <p>No tasks available to generate statistics.</p>
                <button 
                  className="btn-primary" 
                  onClick={() => handleTabChange('tasks')}
                  style={{ marginTop: '1rem' }}
                >
                  Add Your First Task
                </button>
              </div>
            ) : (
              <div className="statistics-container">
                <div className="stat-card">
                  <h3 className="stat-title">Task Overview</h3>
                  <div className="stat-grid">
                    <div className="stat-item">
                      <span className="stat-value">{tasks.length}</span>
                      <span className="stat-label">Total Tasks</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">
                        {tasks.filter(task => task.completed).length}
                      </span>
                      <span className="stat-label">Completed</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">
                        {tasks.filter(task => !task.completed).length}
                      </span>
                      <span className="stat-label">Pending</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">
                        {Math.round((tasks.filter(task => task.completed).length / tasks.length) * 100)}%
                      </span>
                      <span className="stat-label">Completion Rate</span>
                    </div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <h3 className="stat-title">Task Distribution</h3>
                  <div className="stat-chart">
                    <div className="bar-chart">
                      {/* Simple bar chart showing task distribution */}
                      <div 
                        className="bar bar-completed" 
                        style={{ 
                          width: `${(tasks.filter(task => task.completed).length / tasks.length) * 100}%`,
                          backgroundColor: 'var(--success-color)'
                        }}
                      >
                        Completed
                      </div>
                      <div 
                        className="bar bar-pending" 
                        style={{ 
                          width: `${(tasks.filter(task => !task.completed).length / tasks.length) * 100}%`,
                          backgroundColor: 'var(--primary-color)'
                        }}
                      >
                        Pending
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <h3 className="stat-title">Recent Activity</h3>
                  <div className="recent-tasks">
                    {tasks
                      .sort((a, b) => {
                        // Sort by due date, most recent first
                        if (!a.due_date) return 1;
                        if (!b.due_date) return -1;
                        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
                      })
                      .slice(0, 5)
                      .map(task => (
                        <div key={task.id} className={`recent-task-item ${task.completed ? 'completed' : ''}`}>
                          <span className="task-title">{task.title}</span>
                          {task.due_date && (
                            <span className="task-date">
                              {format(parseISO(task.due_date), 'MMM d, yyyy')}
                            </span>
                          )}
                          <span className={`task-status ${task.completed ? 'completed' : 'pending'}`}>
                            {task.completed ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div className="stat-card">
                  <h3 className="stat-title">Recurring Tasks</h3>
                  <div className="stat-info">
                    <p>
                      <strong>{tasks.filter(task => task.recurrence_rule).length}</strong> recurring tasks set up
                    </p>
                    <div className="recurrence-types">
                      {tasks
                        .filter(task => task.recurrence_rule)
                        .map(task => {
                          const rule = JSON.parse(task.recurrence_rule || '{}');
                          return (
                            <div key={task.id} className="recurrence-type-item">
                              <span className="recurrence-task">{task.title}</span>
                              <span className="recurrence-frequency">
                                {rule.frequency} (every {rule.interval} {rule.interval === 1 ? rule.frequency.slice(0, -2) : rule.frequency})
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
      
      {activeTab === 'settings' && (
  <SettingsComponent />
)}
    </div>
  );
}

{/* Add this to your tab content section */}
