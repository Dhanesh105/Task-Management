import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';

interface Task {
  id?: number;
  title: string;
  description?: string;
  due_date?: string;
  completed?: boolean;
  recurrence_rule?: string;
}

interface NavbarCalendarProps {
  tasks: Task[];
  onDayClick?: (date: Date, tasks: Task[]) => void;
}

const NavbarCalendar = ({ tasks, onDayClick }: NavbarCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Generate days for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day names for header (Mon, Tue, etc.)
  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // Function to get tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      return isSameDay(parseISO(task.due_date), day);
    });
  };
  
  // Function to determine the color based on task state
  const getDayColor = (day: Date) => {
    const dayTasks = getTasksForDay(day);
    
    if (dayTasks.length === 0) return '';
    
    // If any task is incomplete, show as pending (primary color)
    if (dayTasks.some(task => !task.completed)) {
      return 'has-pending-task';
    }
    
    // If all tasks are complete, show as completed (success color)
    return 'all-completed-tasks';
  };

  // Handle previous month
  const prevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  // Handle next month
  const nextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  // Handle day click
  const handleDayClick = (day: Date) => {
    if (onDayClick) {
      const dayTasks = getTasksForDay(day);
      onDayClick(day, dayTasks);
    }
  };

  return (
    <div className="navbar-calendar">
      <div className="navbar-calendar-header">
        <button className="calendar-nav-btn" onClick={prevMonth}>◀</button>
        <span className="navbar-calendar-title">{format(currentMonth, 'MMMM yyyy')}</span>
        <button className="calendar-nav-btn" onClick={nextMonth}>▶</button>
      </div>
      
      <div className="navbar-calendar-weekdays">
        {weekDays.map((day, index) => (
          <div key={index} className="navbar-calendar-weekday">{day}</div>
        ))}
      </div>
      
      <div className="navbar-calendar-days">
        {daysInMonth.map((day) => {
          const dayColor = getDayColor(day);
          const isToday = isSameDay(day, new Date());
          const tasksForDay = getTasksForDay(day);
          const hasTask = tasksForDay.length > 0;
          
          return (
            <div 
              key={day.toString()} 
              className={`navbar-calendar-day ${dayColor} ${isToday ? 'today' : ''}`}
              onClick={() => handleDayClick(day)}
              title={hasTask ? `${tasksForDay.length} task(s) on ${format(day, 'MMM d')}` : ''}
            >
              {format(day, 'd')}
              {hasTask && <span className="task-indicator"></span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NavbarCalendar;