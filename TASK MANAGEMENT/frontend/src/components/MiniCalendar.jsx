import React, { useState } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

const MiniCalendar = ({ dates, month: initialMonth = new Date() }) => {
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  
  // Generate days for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day names for header
  const weekDays = Array.from({ length: 7 }, (_, i) => 
    format(addDays(new Date(2023, 0, 1), i), 'EEE')
  );

  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  return (
    <div className="recurrence-calendar-card">
      <div className="recurrence-calendar-header">
        <button className="recurrence-calendar-nav-btn" onClick={handlePrevMonth}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h3 className="recurrence-calendar-title">{format(currentMonth, 'MMMM yyyy')}</h3>
        <button className="recurrence-calendar-nav-btn" onClick={handleNextMonth}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      <div className="recurrence-calendar-weekdays">
        {weekDays.map((day, index) => (
          <div key={index} className="recurrence-calendar-weekday">
            {day}
          </div>
        ))}
      </div>
      
      <div className="recurrence-calendar-days">
        {daysInMonth.map((day) => {
          const isSelected = dates?.some(date => 
            date instanceof Date && isSameDay(date, day)
          );
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={day.toString()} 
              className={`recurrence-calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
            >
              <span className="recurrence-day-number">{format(day, 'd')}</span>
              {isSelected && <span className="recurrence-indicator"></span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;