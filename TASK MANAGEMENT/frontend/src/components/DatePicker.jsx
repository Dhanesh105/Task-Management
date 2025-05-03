import React from 'react';

const DatePicker = ({ value, onChange, label }) => {
  return (
    <div className="form-group date-picker-container">
      {label && <label className="date-label">{label}</label>}
      <div className="styled-date-input">
        <input 
          type="date" 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="date-input"
        />
        <span className="date-icon">📅</span>
      </div>
    </div>
  );
};

export default DatePicker;