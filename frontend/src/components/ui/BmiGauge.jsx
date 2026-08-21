import React from 'react';

const BmiGauge = ({ bmi, category, color }) => {
  // Map BMI to angle (15 to 40 BMI range → 0 to 180 degrees)
  const minBmi = 15;
  const maxBmi = 40;
  const clampedBmi = Math.max(minBmi, Math.min(maxBmi, bmi || minBmi));
  const angle = ((clampedBmi - minBmi) / (maxBmi - minBmi)) * 180;
  
  const radius = 80;
  const cx = 100;
  const cy = 100;
  
  // Needle animation logic below

  return (
    <svg viewBox="0 0 200 120" style={{ width: '100%', maxWidth: '220px' }}>
      {/* Background arc segments */}
      {/* Underweight: 0-36deg (blue) */}
      <path d="M 20 100 A 80 80 0 0 1 42.9 39.5" fill="none" stroke="#93c5fd" strokeWidth="12" strokeLinecap="round" />
      {/* Normal: 36-72deg (green) */}
      <path d="M 42.9 39.5 A 80 80 0 0 1 100 20" fill="none" stroke="#86efac" strokeWidth="12" strokeLinecap="round" />
      {/* Overweight: 72-108deg (yellow) */}
      <path d="M 100 20 A 80 80 0 0 1 157.1 39.5" fill="none" stroke="#fde68a" strokeWidth="12" strokeLinecap="round" />
      {/* Obese: 108-180deg (red) */}
      <path d="M 157.1 39.5 A 80 80 0 0 1 180 100" fill="none" stroke="#fca5a5" strokeWidth="12" strokeLinecap="round" />
      
      {/* Needle */}
      <line x1={cx} y1={cy} x2={cx - radius * 0.75} y2={cy} stroke={color || '#64748b'} strokeWidth="3" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`${angle} ${cx} ${cy}`} dur="1s" fill="freeze" />
      </line>
      
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="6" fill={color || '#64748b'} />
      <circle cx={cx} cy={cy} r="3" fill="white" />
      
      {/* BMI Value */}
      <text x={cx} y={cy + 2} textAnchor="middle" fill="var(--text)" fontSize="10" fontWeight="bold" dy="-20">{bmi || '--'}</text>
      
      {/* Labels */}
      <text x="20" y="115" textAnchor="start" fill="var(--text-muted)" fontSize="7">15</text>
      <text x="180" y="115" textAnchor="end" fill="var(--text-muted)" fontSize="7">40</text>
    </svg>
  );
};

export default BmiGauge;
