import React from 'react';
import { format } from 'date-fns';

const TaskList = ({ tasks, onDelete, onToggleComplete, onEdit }) => {
  if (!tasks || tasks.length === 0) {
    return <div className="empty-state">No tasks found. Create a new task to get started!</div>;
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div 
          key={task.id} 
          className={`task-item ${task.completed ? 'completed' : ''}`}
        >
          <div className="task-content">
            <h3 className="task-title">{task.title}</h3>
            {task.description && <p className="task-description">{task.description}</p>}
            {task.due_date && (
              <p className="due-date">📅 Due: {format(new Date(task.due_date), 'MMM d, yyyy')}</p>
            )}
            {task.recurrence_rule && (
              <p className="recurrence-info">🔄 Recurring: {JSON.parse(task.recurrence_rule).frequency}</p>
            )}
          </div>
          <div className="task-actions">
            <button 
              onClick={() => onToggleComplete(task.id, !task.completed)}
              className={`btn-action ${task.completed ? 'btn-incomplete' : 'btn-complete'}`}
            >
              {task.completed ? '↩️ Undo' : '✓ Complete'}
            </button>
            <button onClick={() => onEdit(task)} className="btn-action btn-edit">✏️ Edit</button>
            <button onClick={() => onDelete(task.id)} className="btn-action btn-delete">🗑️ Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;