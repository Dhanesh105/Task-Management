import React, { useState, useEffect } from 'react';
import DatePicker from './DatePicker';

const RecurrenceForm = ({ onChange, initialValue }) => {
  const [frequency, setFrequency] = useState(initialValue?.frequency || 'none');
  const [interval, setInterval] = useState(initialValue?.interval || 1);
  const [weekDays, setWeekDays] = useState(initialValue?.weekDays || []);
  const [monthDay, setMonthDay] = useState(initialValue?.monthDay || 1);
  const [startDate, setStartDate] = useState(initialValue?.startDate || '');
  const [endDate, setEndDate] = useState(initialValue?.endDate || '');

  const weekDayOptions = [
    { value: 'MO', label: 'Monday' },
    { value: 'TU', label: 'Tuesday' },
    { value: 'WE', label: 'Wednesday' },
    { value: 'TH', label: 'Thursday' },
    { value: 'FR', label: 'Friday' },
    { value: 'SA', label: 'Saturday' },
    { value: 'SU', label: 'Sunday' },
  ];

  useEffect(() => {
    const recurrenceRule = frequency === 'none' ? null : {
      frequency,
      interval,
      weekDays: frequency === 'weekly' ? weekDays : [],
      monthDay: frequency === 'monthly' ? monthDay : null,
      startDate,
      endDate: endDate || null,
    };
    
    onChange(recurrenceRule);
  }, [frequency, interval, weekDays, monthDay, startDate, endDate, onChange]);

  const handleWeekDayChange = (day) => {
    setWeekDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    );
  };

  return (
    <div className="card">
      <h3>Recurrence Settings</h3>
      
      <div className="form-group">
        <label>Repeat</label>
        <select 
          value={frequency} 
          onChange={(e) => setFrequency(e.target.value)}
        >
          <option value="none">None</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {frequency !== 'none' && (
        <>
          <div className="form-group">
            <label>Repeat every</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="number" 
                min="1" 
                value={interval} 
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                style={{ width: '80px' }}
              />
              <span>
                {frequency === 'daily' && 'day(s)'}
                {frequency === 'weekly' && 'week(s)'}
                {frequency === 'monthly' && 'month(s)'}
                {frequency === 'yearly' && 'year(s)'}
                {frequency === 'custom' && 'unit(s)'}
              </span>
            </div>
          </div>

          {frequency === 'weekly' && (
            <div className="form-group">
              <label>Repeat on</label>
              <div className="checkbox-group">
                {weekDayOptions.map((day) => (
                  <div key={day.value} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={`day-${day.value}`}
                      checked={weekDays.includes(day.value)}
                      onChange={() => handleWeekDayChange(day.value)}
                    />
                    <label htmlFor={`day-${day.value}`}>{day.label}</label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {frequency === 'monthly' && (
            <div className="form-group">
              <label>Day of month</label>
              <input 
                type="number" 
                min="1" 
                max="31" 
                value={monthDay} 
                onChange={(e) => setMonthDay(parseInt(e.target.value) || 1)}
              />
            </div>
          )}

          <DatePicker 
            label="Start date" 
            value={startDate} 
            onChange={setStartDate} 
          />

          <DatePicker 
            label="End date (optional)" 
            value={endDate} 
            onChange={setEndDate} 
          />
        </>
      )}
    </div>
  );
};

export default RecurrenceForm;