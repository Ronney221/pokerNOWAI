import React from 'react';
import { format } from 'date-fns';

const DateRangeFilter = ({ onDateRangeChange }) => {
  return (
    <div className="flex items-center gap-2">
      <select
        className="select select-sm select-bordered"
        onChange={(e) => {
          if (e.target.value === 'all') {
            onDateRangeChange({ start: null, end: null });
          } else {
            const [year, month] = e.target.value.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Last day of the month
            onDateRangeChange({ start: startDate, end: endDate });
          }
        }}
      >
        <option value="all">All Time</option>
        {Array.from({ length: 12 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          return (
            <option 
              key={i} 
              value={format(date, 'yyyy-MM')}
            >
              {format(date, 'MMMM yyyy')}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default DateRangeFilter; 