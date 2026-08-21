import React from 'react';

const StatusBadge = ({ label, color, style = {}, className = '' }) => {
  return (
    <span 
      className={`badge ${className}`} 
      style={{ 
        backgroundColor: `${color}20`, 
        color: color, 
        padding: '0.25rem 0.75rem',
        ...style 
      }}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
